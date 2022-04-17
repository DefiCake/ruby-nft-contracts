// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './PaymentSplitterReporter.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract OwnedSplitter is Initializable, OwnableUpgradeable, PaymentSplitterReporter {
    using SafeERC20 for IERC20;

    function initialize(address[] calldata payees, uint256[] calldata shares_) external initializer {
        __Ownable_init();
        __PaymentSplitterReporter_init(payees, shares_);
    }

    function rescueERC20(IERC20 erc20, uint256 amount) external onlyOwner {
        erc20.safeTransfer(msg.sender, amount);
    }

    /// @dev this makes the release function callable only by the owner of funds
    function release() public virtual returns (uint256) {
        return PaymentSplitterReporter.release(payable(msg.sender));
    }

    function release(address payable) public virtual override returns (uint256) {
        revert('DISABLED');
    }

    function release(IERC20Upgradeable, address) public virtual override returns (uint256) {
        revert('DISABLED');
    }
}
