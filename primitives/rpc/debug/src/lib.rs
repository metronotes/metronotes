// Copyright 2019-2020 PureStake Inc.
// This file is part of Moonbeam.

// Moonbeam is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Moonbeam is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Moonbeam.  If not, see <http://www.gnu.org/licenses/>.

#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Decode, Encode};
use ethereum_types::{H256, U256};
use sp_std::vec::Vec;

//pub use moonbeam_rpc_core_debug::types::StepLog;

#[derive(Eq, PartialEq, Debug, Encode, Decode)]
pub struct TraceExecutorResponse {
	pub gas: U256,
	pub return_value: Vec<u8>,
	pub step_logs: Vec<StepLog>,
}

#[derive(Eq, PartialEq, Debug, Encode, Decode)]
pub struct StepLog {
	pub depth: U256,
	//error: TODO
	pub gas: U256,
	pub gas_cost: U256,
	pub memory: Vec<u8>,
	pub op: Vec<u8>,
	pub pc: U256,
	pub stack: Vec<H256>,
	//storage: BTreeMap<H256, H256>, TODO
}

sp_api::decl_runtime_apis! {
	pub trait DebugRuntimeApi {
		fn trace_transaction(transaction_index: u32) -> Option<TraceExecutorResponse>; // TODO return
	}
}