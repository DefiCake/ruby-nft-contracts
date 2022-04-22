// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IFeePoolFacet {
    function accrueRoyalties() external returns (uint256 accruedRoyalties);

    function withdrawRoyalties() external returns (uint256);

    function beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function pool() external view returns (address);
}
