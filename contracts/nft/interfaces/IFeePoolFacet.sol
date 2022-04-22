// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IFeePoolFacet {
    function accrueRewards() external returns (uint256 accruedAmount);
}
