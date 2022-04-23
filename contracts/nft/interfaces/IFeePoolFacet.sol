// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IFeePoolFacet {
    event AccruedRoyalties(uint256 globalEarnedWei, uint256 accruedWeiPerShare, uint256 balance);
    event WithdrawnRoyalties(address indexed sender, uint256 amount, uint256 balance);
    event LockerUpdated(address indexed user, uint256 earnt, uint256 debt, uint256 withdrawableWei, uint256 newDebtWei);

    function accrueRoyalties() external returns (uint256 accruedRoyalties);

    function withdrawRoyalties() external returns (uint256);

    function beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function pool() external view returns (address);
}
