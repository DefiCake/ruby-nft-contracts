// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol';

contract OwnedSplitterV1 is Initializable, PaymentSplitterUpgradeable {
    function initialize(address[] calldata payees, uint256[] calldata shares) external initializer {
        __PaymentSplitter_init_unchained(payees, shares);
    }

    /// @notice disabled event, no need to spend gas
    receive() external payable virtual override {}

    /// @notice disabled erc20
    function release(IERC20Upgradeable, address) public virtual override {
        revert('DISABLED');
    }
}
