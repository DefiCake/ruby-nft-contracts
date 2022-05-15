// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library UriSetterV1Lib {
    bytes32 constant STORAGE_POSITION = keccak256('eth.urisetterv1.storage');

    struct UriSetterV1Storage {
        bytes32 root;
        mapping(uint256 => bool) set;
    }

    function Storage() internal pure returns (UriSetterV1Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
