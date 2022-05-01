// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '../libraries/ERC721Lib.sol';
import '../libraries/FeePoolLib.sol';
import '../../interfaces/IPaymentSplitter.sol';
import '../interfaces/IFeePoolFacet.sol';
import '../utils/UsingDiamondSelfCall.sol';
import '../../misc/DivByNonZero.sol';

import 'hardhat/console.sol';

contract FeePoolFacet is DivByNonZero, UsingDiamondSelfCall, IFeePoolFacet {
    uint256 private constant PRECISION = 1e18;
    address public immutable override pool;

    constructor(address _pool) {
        pool = _pool;
    }

    function accrueRoyalties() public override returns (uint256 accruedRoyalties) {
        uint256 totalSupply = ERC721Lib.Storage().totalSupply;

        if (totalSupply > 0) {
            FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();

            uint256 lastWeiCheckpoint = s.lastWeiCheckpoint;

            try IPaymentSplitter(pool).release(payable(address(this))) {} catch {}

            uint256 currentBalance = address(this).balance;

            if (currentBalance > lastWeiCheckpoint) {
                unchecked {
                    accruedRoyalties = currentBalance - lastWeiCheckpoint;
                }
                uint256 globalEarnedWei = s.globalEarnedWei + accruedRoyalties;
                uint256 accruedWeiPerShare = s.accruedWeiPerShare +
                    divByNonZero(accruedRoyalties * PRECISION, totalSupply);

                s.globalEarnedWei = globalEarnedWei;
                s.accruedWeiPerShare = accruedWeiPerShare;
                s.lastWeiCheckpoint = currentBalance;

                emit AccruedRoyalties(globalEarnedWei, accruedWeiPerShare, currentBalance);
            }
        }
    }

    function withdrawRoyalties() external override returns (uint256) {
        accrueRoyalties();
        uint256 withdrawableWei = _updateLockerFor(msg.sender);

        require(withdrawableWei > 0, 'NO_REWARD');

        FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();
        s.lockers[msg.sender].withdrawableWei = 0;
        s.lastWeiCheckpoint -= withdrawableWei;

        (bool success, ) = msg.sender.call{ value: withdrawableWei }('');
        require(success, 'ETH_SEND_FAIL');
        return withdrawableWei;
    }

    function beforeTokenTransfer(
        address from,
        address to,
        uint256
    ) external override onlyDiamond {
        accrueRoyalties();

        // For mint cases
        if (from != address(0)) _updateLockerFor(from);
        // For burn cases
        if (to != address(0)) _updateLockerFor(to);
    }

    /// TODO apply short circuit to avoid update if not necessary
    function _updateLockerFor(address addr) internal returns (uint256) {
        uint256 shares = ERC721Lib.Storage()._balanceOf[addr];

        FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();

        uint256 accruedWeiPerShare = s.accruedWeiPerShare;
        uint256 debt = s.lockers[addr].debtWei;
        uint256 earnt = divByNonZero((accruedWeiPerShare - debt) * shares, PRECISION);
        uint256 withdrawableWei = s.lockers[addr].withdrawableWei + earnt;

        s.lockers[addr].debtWei = accruedWeiPerShare;
        s.lockers[addr].withdrawableWei = withdrawableWei;

        emit LockerUpdated(addr, earnt, debt, withdrawableWei, accruedWeiPerShare);

        return withdrawableWei;
    }

    // /// TODO apply short circuit to avoid update if not necessary
    // function _updateLockerFor(address addr) internal returns (uint256) {
    //     uint256 shares = ERC721Lib.Storage()._balanceOf[addr];

    //     FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();

    //     uint256 earnt = (s.accruedWeiPerShare * shares) / PRECISION;
    //     uint256 debt = s.lockers[addr].debtWei;
    //     uint256 withdrawableWei = earnt - debt;
    //     uint256 newDebtWei = s.globalEarnedWei;

    //     s.lockers[addr].withdrawableWei = withdrawableWei;
    //     s.lockers[addr].debtWei = newDebtWei;

    //     emit LockerUpdated(addr, earnt, debt, withdrawableWei, newDebtWei);

    //     return withdrawableWei;
    // }

    function getCurrentFeeGlobals()
        external
        view
        override
        returns (
            uint256 globalEarnedWei,
            uint256 lastWeiCheckpoint,
            uint256 accruedWeiPerShare
        )
    {
        FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();
        return (s.globalEarnedWei, s.lastWeiCheckpoint, s.accruedWeiPerShare);
    }
}
