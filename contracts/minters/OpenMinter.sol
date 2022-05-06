// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import '../interfaces/IMinter.sol';
import './PayableChainlinkMinter.sol';

contract OpenMinter is IMinter, Ownable, PayableChainlinkMinter {
    constructor(
        address _mintable,
        address _oracle,
        uint256 _price
    ) PayableChainlinkMinter(_mintable, _oracle, _price) {}

    function mint(bytes32[] calldata proof) external payable override {
        _mint(msg.sender);
    }

    function batchMint(bytes32[] calldata proof, uint256 amount) external payable override {
        _batchMint(msg.sender, amount);
    }

    function withdraw() external override onlyOwner {
        SafeTransferLib.safeTransferETH(msg.sender, address(this).balance);
    }
}
