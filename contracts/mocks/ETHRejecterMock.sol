// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract ETHRejecetMock {
    receive() external payable virtual {
        revert();
    }
}
