// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IUriSetterFacetV1 {
    function uriSetterV1SetRoot(bytes32 _root) external;

    function uriSetterV1SetTokenURI(
        uint256 tokenId,
        string calldata customUri,
        bytes32[] calldata proof
    ) external;

    function getUriSetterV1Root() external view returns (bytes32);

    function uriSetterV1IsSet(uint256 tokenId) external view returns (bool);
}
