// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import './PayableChainlinkMinter.sol';

contract OpenMinter is Ownable, PayableChainlinkMinter {
    using MerkleProof for bytes32[];

    mapping(address => bool) public verified;

    constructor(address _mintable, address _oracle) PayableChainlinkMinter(_mintable, _oracle) {}

    function mint(bytes32[] calldata, bytes32) external payable {
        _mint(msg.sender);
    }

    function batchMint(
        bytes32[] calldata,
        bytes32,
        uint256 amount
    ) external payable {
        _batchMint(msg.sender, amount);
    }

    function withdraw() external {
        SafeTransferLib.safeTransferETH(msg.sender, address(this).balance);
    }
}
