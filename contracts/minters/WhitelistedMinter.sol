// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import './PayableChainlinkMinter.sol';

contract WhitelistedMinter is Ownable, PayableChainlinkMinter {
    using MerkleProof for bytes32[];

    uint256 immutable LIMIT;

    bytes32 public root;
    mapping(address => bool) public verified;

    constructor(
        uint256 limit,
        address _mintable,
        address _oracle,
        uint256 _price
    ) PayableChainlinkMinter(_mintable, _oracle, _price) {
        LIMIT = limit;
    }

    function setRoot(bytes32 _root) external onlyOwner {
        root = _root;
    }

    modifier canMint() {
        require(block.timestamp < LIMIT, 'TIMEOUT');
        _;
    }

    function mint(bytes32[] calldata proof, bytes32 leaf) external payable virtual {
        require(root != bytes32(0), 'MINTER_UNINITIALIZED');
        if (!verified[msg.sender]) {
            proof.verify(root, leaf);
            verified[msg.sender] = true;
        }

        _mint(msg.sender);
    }

    function withdraw() external onlyOwner {
        SafeTransferLib.safeTransferETH(msg.sender, address(this).balance);
    }
}
