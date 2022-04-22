// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;
import '../libraries/ERC721Lib.sol';
import '../libraries/FeePoolLib.sol';
import '../../interfaces/IPaymentSplitter.sol';
import '../utils/UsingDiamondSelfCall.sol';

import 'hardhat/console.sol';

contract FeePoolFacet is UsingDiamondSelfCall {
    uint256 private constant PRECISION = 1e18;
    address public immutable pool;

    constructor(address _pool) {
        pool = _pool;
    }

    function accrueRoyalties() public returns (uint256 accruedRoyalties) {
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
                s.globalEarnedWei += accruedRoyalties;
                s.accruedWeiPerShare = (s.globalEarnedWei * PRECISION) / totalSupply;
            }
        }
    }

    function withdrawRoyalties() external returns (uint256) {
        accrueRoyalties();
        FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();

        uint256 withdrawableWei = s.lockers[msg.sender].withdrawableWei;
        require(withdrawableWei > 0, 'NO_REWARD');

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
    ) external onlyDiamond {
        accrueRoyalties();

        // For mint cases
        if (from != address(0)) {
            _updateLockerFor(from);
        }

        if (to != address(0)) {
            _updateLockerFor(to);
        }
    }

    function _updateLockerFor(address addr) internal {
        uint256 balance = ERC721Lib.Storage()._balanceOf[addr];

        FeePoolLib.FeePoolStorage storage s = FeePoolLib.Storage();

        uint256 earnt = (s.accruedWeiPerShare * balance) / PRECISION;
        uint256 debt = s.lockers[addr].debtWei;

        s.lockers[addr].withdrawableWei = earnt - debt;
        s.lockers[addr].debtWei = s.globalEarnedWei;
    }
}
