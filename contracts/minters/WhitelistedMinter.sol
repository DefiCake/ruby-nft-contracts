// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

import '../interfaces/IMinter.sol';
import './PayableChainlinkMinter.sol';

contract WhitelistedMinter is IMinter, Ownable, PayableChainlinkMinter {
    using MerkleProof for bytes32[];

    uint256 immutable LIMIT;

    bytes32 public root;
    mapping(bytes32 => bool) public verified;

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

    modifier canMint(bytes32[] calldata proof) {
        require(block.timestamp < LIMIT, 'TIMEOUT');
        require(root != bytes32(0), 'MINTER_UNINITIALIZED');
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(verified[leaf] || (verified[leaf] = proof.verify(root, leaf)), 'WHITELIST');

        _;
    }

    function mint(bytes32[] calldata proof) external payable virtual override canMint(proof) {
        _mint(msg.sender);
    }

    function batchMint(bytes32[] calldata proof, uint256 amount) external payable virtual override canMint(proof) {
        _batchMint(msg.sender, amount);
    }

    function withdraw() external virtual override onlyOwner {
        SafeTransferLib.safeTransferETH(msg.sender, address(this).balance);
    }
}
