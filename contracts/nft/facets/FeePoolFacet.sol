// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '../libraries/ERC721Lib.sol';
import '../libraries/FeePoolLib.sol';
import '../../interfaces/IPaymentSplitter.sol';
import '../interfaces/IFeePoolFacet.sol';
import '../utils/UsingDiamondSelfCall.sol';
import '../../misc/DivByNonZero.sol';

// import 'hardhat/console.sol';

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
                uint256 accruedWeiPerShare = s.accruedWeiPerShare +
                    divByNonZero(accruedRoyalties * PRECISION, totalSupply);

                s.accruedWeiPerShare = accruedWeiPerShare;
                s.lastWeiCheckpoint = currentBalance;

                emit AccruedRoyalties(accruedRoyalties, accruedWeiPerShare);
            }
        }
    }

    function withdrawRoyalties() external override returns (uint256) {
        accrueRoyalties();
        uint256 withdrawableWei = _updateLockerFor(msg.sender);

        require(withdrawableWei > 0, 'NO_REWARD');

        FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();
        s.lockers[msg.sender].withdrawableWei = 0;
        uint256 checkpoint = address(this).balance - withdrawableWei;
        s.lastWeiCheckpoint = checkpoint;

        (bool success, ) = msg.sender.call{ value: withdrawableWei }('');
        require(success, 'ETH_SEND_FAIL');

        emit WithdrawnRoyalties(msg.sender, withdrawableWei, checkpoint);
        return withdrawableWei;
    }

    function beforeTokenTransfer(
        address from,
        address to,
        uint256
    ) external override onlyDiamond {
        // console.log('address(this)', address(this));
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
        // console.log(addr, 'old debt', s.lockers[addr].debtWei);
        uint256 earnt = divByNonZero((accruedWeiPerShare - debt) * shares, PRECISION);
        uint256 withdrawableWei = s.lockers[addr].withdrawableWei + earnt;
        // console.log(addr, accruedWeiPerShare, debt);
        // console.log('+', earnt, 'rate: ', accruedWeiPerShare - debt);
        s.lockers[addr].debtWei = accruedWeiPerShare;
        // console.log(addr, 'new debt', s.lockers[addr].debtWei);
        s.lockers[addr].withdrawableWei = withdrawableWei;

        emit LockerUpdated(addr, earnt, debt, withdrawableWei, accruedWeiPerShare);

        return withdrawableWei;
    }

    function getCurrentFeeGlobals()
        external
        view
        override
        returns (uint256 lastWeiCheckpoint, uint256 accruedWeiPerShare)
    {
        FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();
        return (s.lastWeiCheckpoint, s.accruedWeiPerShare);
    }

    function getLockerInfo(address addr) external view override returns (FeePoolLib.Locker memory) {
        return FeePoolLib.Storage().lockers[addr];
    }
}
