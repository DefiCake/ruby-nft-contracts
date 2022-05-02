// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import './PayableChainlinkMinter.sol';

contract OpenMinterLimited is Ownable, PayableChainlinkMinter {
    uint256 public immutable limit;

    constructor(
        address _mintable,
        address _oracle,
        uint256 _price,
        uint256 _limit
    ) PayableChainlinkMinter(_mintable, _oracle, _price) {
        limit = _limit;
    }

    function mint(bytes32[] calldata, bytes32) external payable {
        require(block.timestamp < limit, 'TIMEOUT');
        _mint(msg.sender);
    }

    function batchMint(
        bytes32[] calldata,
        bytes32,
        uint256 amount
    ) external payable {
        require(block.timestamp < limit, 'TIMEOUT');
        _batchMint(msg.sender, amount);
    }

    function withdraw() external {
        SafeTransferLib.safeTransferETH(msg.sender, address(this).balance);
    }
}
