// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library FeePoolLib {
    bytes32 constant STORAGE_POSITION = keccak256('eth.feepool.storage');

    struct Locker {
        uint256 debtWei;
        uint256 withdrawableWei;
    }

    struct FeePoolStorage {
        uint256 globalEarnedWei;
        uint256 lastWeiCheckpoint;
        uint256 accruedWeiPerShare;
        mapping(address => Locker) lockers;
    }

    function Storage() internal pure returns (FeePoolStorage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
