// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IMinter {
    function mint(bytes32[] calldata proof) external payable;

    function batchMint(bytes32[] calldata proof, uint256 amount) external payable;

    function withdraw() external;
}
