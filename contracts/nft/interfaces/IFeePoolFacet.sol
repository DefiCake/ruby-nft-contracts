// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IFeePoolFacet {
    event UpdatedWeiCheckpoint(uint256 checkpoint);
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

    function getCurrentCheckpoint() external view returns (uint256);
}
