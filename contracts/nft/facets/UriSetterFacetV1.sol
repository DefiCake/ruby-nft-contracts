// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../interfaces/IUriSetterFacetV1.sol';
import '../libraries/ERC721Lib.sol';
import '../libraries/UriSetterV1Lib.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import 'hardhat-deploy/solc_0.8/diamond/UsingDiamondOwner.sol';

contract UriSetterFacetV1 is UsingDiamondOwner, IUriSetterFacetV1 {
    using MerkleProof for bytes32[];

    function uriSetterV1SetRoot(bytes32 _root) external override onlyOwner {
        UriSetterV1Lib.Storage().root = _root;
    }

    function uriSetterV1SetTokenURI(
        uint256 tokenId,
        string calldata customUri,
        bytes32[] calldata proof
    ) external override {
        UriSetterV1Lib.UriSetterV1Storage storage s = UriSetterV1Lib.Storage();

        require(s.root != bytes32(0), 'ROOT_UNINITIALIZED');
        require(!s.set[tokenId], 'ALREADY_SET');
        require(ERC721Lib.Storage()._ownerOf[tokenId] == msg.sender, 'NOT_AUTHORIZED');
        require(proof.verify(s.root, keccak256(abi.encodePacked(tokenId, customUri))), 'BAD_PROOF');

        s.set[tokenId] = true;
        ERC721Lib.Storage().tokenUri[tokenId] = customUri;
    }

    function getUriSetterV1Root() external view override returns (bytes32) {
        return UriSetterV1Lib.Storage().root;
    }

    function uriSetterV1IsSet(uint256 tokenId) external view override returns (bool) {
        return UriSetterV1Lib.Storage().set[tokenId];
    }
}
