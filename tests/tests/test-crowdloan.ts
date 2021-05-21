import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { expect } from "chai";
import Web3 from "web3";
import { Account } from "web3-core";

import {
  GENESIS_ACCOUNT,
  GENESIS_ACCOUNT_BALANCE,
  GENESIS_ACCOUNT_PRIVATE_KEY,
  GLMR,
  ALITH_PRIV_KEY,
  ALITH,
} from "../util/constants";
import { describeDevMoonbeam } from "../util/setup-dev-tests";

describeDevMoonbeam("Crowdloan", (context) => {
  let genesisAccount: KeyringPair;
  const relayChainAddress: string = "couldBeAnyString";
  before("Setup genesis account for substrate", async () => {
    const keyring = new Keyring({ type: "ethereum" });
    genesisAccount = await keyring.addFromUri(GENESIS_ACCOUNT_PRIVATE_KEY, null, "ethereum");
  });
  it("should be able to register the genesis account for reward", async function () {
    // check that genesis has genesis balance
    expect(Number(await context.web3.eth.getBalance(GENESIS_ACCOUNT))).to.eq(
      Number(GENESIS_ACCOUNT_BALANCE)
    );

    // should be able to register the genesis account for reward
    const isPayable = await context.polkadotApi.query.crowdloanRewards.accountsPayable(
      GENESIS_ACCOUNT
    );
    expect(isPayable.toHuman()).to.equal(null);
    await context.polkadotApi.tx.sudo
      .sudo(
        context.polkadotApi.tx.crowdloanRewards.initializeRewardVec(
          [[relayChainAddress, GENESIS_ACCOUNT, 3_000_000n * GLMR]],
          0,
          1
        )
      )
      .signAndSend(genesisAccount);
    await context.createBlock();
    expect(
      (
        (
          await context.polkadotApi.query.crowdloanRewards.accountsPayable(GENESIS_ACCOUNT)
        ).toHuman() as any
      ).total_reward
    ).to.equal("3.0000 MUnit");
    let isInitialized = await context.polkadotApi.query.crowdloanRewards.initialized();
    expect(isInitialized.toHuman()).to.be.true;

    // construct a transaction
    // First claim should have 0 fees
    const transfer = context.polkadotApi.tx.crowdloanRewards.myFirstClaim();
    const { partialFee, weight } = await transfer.paymentInfo(genesisAccount);
    expect(partialFee.toHuman()).to.equal("0");
    await transfer.signAndSend(genesisAccount);

    await context.createBlock();
    expect(
      (
        (
          await context.polkadotApi.query.crowdloanRewards.accountsPayable(GENESIS_ACCOUNT)
        ).toHuman() as any
      ).claimed_reward
    ).to.equal("600.0059 kUnit");

    // check balances
    expect(
      (
        Number(await context.web3.eth.getBalance(GENESIS_ACCOUNT)) - Number(GENESIS_ACCOUNT_BALANCE)
      ).toString()
    ).to.equal("6.0000595238095236e+23");
    const account = await context.polkadotApi.query.system.account(GENESIS_ACCOUNT);
    expect(
      (Number(account.data.free.toString()) - Number(GENESIS_ACCOUNT_BALANCE)).toString()
    ).to.equal("6.0000595238095236e+23");

    //should not be able to perform first check again
    await context.polkadotApi.tx.crowdloanRewards.myFirstClaim().signAndSend(genesisAccount);
    await context.createBlock();
    const isPayable3 = await context.polkadotApi.query.crowdloanRewards.accountsPayable(
      GENESIS_ACCOUNT
    );

    // Claimed reward did not update
    expect((isPayable3.toHuman() as any).claimed_reward).to.equal("600.0059 kUnit");

    // should show me the money after 5 blocks
    // only works with a relaychain
    await context.createBlock();
    await context.createBlock();
    await context.createBlock();
    await context.polkadotApi.tx.crowdloanRewards.showMeTheMoney().signAndSend(genesisAccount);
    await context.createBlock();
    const isPayable4 = await context.polkadotApi.query.crowdloanRewards.accountsPayable(
      GENESIS_ACCOUNT
    );
    expect((isPayable4.toHuman() as any).claimed_reward).to.equal("600.0357 kUnit");

    // should not be able to call initializeRewardVec another time
    await context.polkadotApi.tx.sudo
      .sudo(
        context.polkadotApi.tx.crowdloanRewards.initializeRewardVec(
          [[relayChainAddress, ALITH, 1000n * GLMR]],
          0,
          1
        )
      )
      .signAndSend(genesisAccount);
    await context.createBlock();
    expect(
      (await context.polkadotApi.query.crowdloanRewards.accountsPayable(ALITH)).toHuman() as any
    ).to.equal(null);
    // TODO
    // const isPayable5 = await context.polkadotApi.query.crowdloanRewards.VestingPeriod(
    //   GENESIS_ACCOUNT
    // );
    // console.log("ACCOUNT", isPayable5.toHuman());
  });
});
describeDevMoonbeam("Crowdloan", (context) => {
  let genesisAccount: KeyringPair;
  let alithAccount: KeyringPair;
  const relayChainAddress: string = "couldBeAnyString";
  before("Setup genesis account for substrate", async () => {
    const keyring = new Keyring({ type: "ethereum" });
    genesisAccount = await keyring.addFromUri(GENESIS_ACCOUNT_PRIVATE_KEY, null, "ethereum");
    alithAccount = await keyring.addFromUri(ALITH_PRIV_KEY, null, "ethereum");
  });

  it("should be able to register the genesis account for reward - with small amount", async function () {
    // initializeRewardVec
    await context.polkadotApi.tx.sudo
      .sudo(
        context.polkadotApi.tx.crowdloanRewards.initializeRewardVec(
          [[relayChainAddress, ALITH, 3_000_000n * GLMR]],
          0,
          1
        )
      )
      .signAndSend(genesisAccount);
    await context.createBlock();
    expect(
      ((await context.polkadotApi.query.crowdloanRewards.accountsPayable(ALITH)).toHuman() as any)
        .total_reward
    ).to.equal("3.0000 MUnit");

    // showMeTheMoney
    await context.polkadotApi.tx.crowdloanRewards.showMeTheMoney().signAndSend(alithAccount);
    await context.createBlock();
    const isPayable4 = await context.polkadotApi.query.crowdloanRewards.accountsPayable(ALITH);
    expect((isPayable4.toHuman() as any).claimed_reward).to.equal("600.0059 kUnit");
  });
});
describeDevMoonbeam("Crowdloan", (context) => {
  let genesisAccount: KeyringPair;
  const relayChainAddress: string = "couldBeAnyString";
  const numberOfAccounts: number = 5000; // min 2
  let largInput: [string, string, bigint][];

  before("Setup genesis account for substrate", async () => {
    const keyring = new Keyring({ type: "ethereum" });
    genesisAccount = await keyring.addFromUri(GENESIS_ACCOUNT_PRIVATE_KEY, null, "ethereum");
  });

  it("should be able to register many accounts : " + numberOfAccounts, async function () {
    // should create a bunch of test eth accounts
    this.timeout(30000);
    let web3 = new Web3();
    let accounts = new Array(numberOfAccounts).fill(0).map((_, i) => web3.eth.accounts.create());
    largInput = accounts.map((acc: Account, i: number) => {
      return [relayChainAddress + i.toString(), acc.address, 1000n * GLMR];
    });
    expect(largInput.length).to.eq(numberOfAccounts);
    expect(largInput[0][1] !== largInput[numberOfAccounts - 1][1]).to.eq(true);

    // should be able to register many accounts
    await context.polkadotApi.tx.sudo
      .sudo(context.polkadotApi.tx.crowdloanRewards.initializeRewardVec(largInput, 0, largInput))
      .signAndSend(genesisAccount);
    await context.createBlock();
    await Promise.all(
      largInput.map(async (input) => {
        expect(
          (
            (
              await context.polkadotApi.query.crowdloanRewards.accountsPayable(input[1])
            ).toHuman() as any
          ).total_reward
        ).to.equal("1.0000 kUnit");
      })
    );
  });
});

describeDevMoonbeam("Crowdloan", (context) => {
  let genesisAccount: KeyringPair;
  const relayChainAddress: string = "couldBeAnyString";
  const numberOfAccounts: number = 5000; // min 2
  let largInput: [string, string, bigint][];

  before("Setup genesis account for substrate", async () => {
    const keyring = new Keyring({ type: "ethereum" });
    genesisAccount = await keyring.addFromUri(GENESIS_ACCOUNT_PRIVATE_KEY, null, "ethereum");
  });

  it("should be able to register many accounts - batch : " + numberOfAccounts, async function () {
    // should create a bunch of test eth accounts
    this.timeout(20000);
    let web3 = new Web3();
    let accounts = new Array(numberOfAccounts).fill(0).map((_, i) => web3.eth.accounts.create());
    largInput = accounts.map((acc: Account, i: number) => {
      return [relayChainAddress + i.toString(), acc.address, 1000n * GLMR];
    });
    expect(largInput.length).to.eq(numberOfAccounts);
    expect(largInput[0][1] !== largInput[numberOfAccounts - 1][1]).to.eq(true);

    // should be able to register many accounts
    await context.polkadotApi.tx.utility
      .batch([
        await context.polkadotApi.tx.sudo.sudo(
          context.polkadotApi.tx.crowdloanRewards.initializeRewardVec(
            largInput.slice(0, Math.floor(numberOfAccounts / 3)),
            0,
            3
          )
        ),
        await context.polkadotApi.tx.sudo.sudo(
          context.polkadotApi.tx.crowdloanRewards.initializeRewardVec(
            largInput.slice(
              Math.floor(numberOfAccounts / 3),
              Math.floor((numberOfAccounts * 2) / 3)
            ),
            1,
            3
          )
        ),
        await context.polkadotApi.tx.sudo.sudo(
          context.polkadotApi.tx.crowdloanRewards.initializeRewardVec(
            largInput.slice(Math.floor((numberOfAccounts * 2) / 3), numberOfAccounts),
            2,
            3
          )
        ),
      ])
      .signAndSend(genesisAccount);
    await context.createBlock();
    await Promise.all(
      largInput.map(async (input) => {
        expect(
          (
            (
              await context.polkadotApi.query.crowdloanRewards.accountsPayable(input[1])
            ).toHuman() as any
          ).total_reward
        ).to.equal("1.0000 kUnit");
      })
    );
  });
});
