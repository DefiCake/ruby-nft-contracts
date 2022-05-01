// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DivByNonZero {
    function divByNonZero(uint256 _num, uint256 _div) internal pure returns (uint256 result) {
        assembly {
            result := div(_num, _div)
        }
    }
}
