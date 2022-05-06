// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

import { FeePoolLib } from '../libraries/FeePoolLib.sol';

interface IFeePoolFacet {
    event AccruedRoyalties(uint256 accrued, uint256 accruedWeiPerShare);
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

    function getCurrentFeeGlobals() external view returns (uint256 lastWeiCheckpoint, uint256 accruedWeiPerShare);

    function getLockerInfo(address addr) external view returns (FeePoolLib.Locker memory);
}
