// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UsingDiamondSelfCall {
    modifier onlyDiamond() {
        require(msg.sender == address(this), 'Only the diamond can call this');
        _;
    }
}
