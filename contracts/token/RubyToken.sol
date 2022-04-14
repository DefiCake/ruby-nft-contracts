// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '../nft/interfaces/IRuby.sol';

contract RubyToken is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    address private _nft;

    function initialize() external initializer {
        __ERC20_init('Ruby', 'RUBY');
        __Ownable_init();
    }

    function nft() public view returns (address) {
        return _nft;
    }

    /** Admin functions */
    function setNFT(address addr) external onlyOwner {
        _nft = addr;
    }

    /** ERC20 Functions */
    function balanceOf(address addr) public view override returns (uint256) {
        return IRuby(_nft).balanceOf(addr) * 1000 * 10**decimals();
    }

    function totalSupply() public view override returns (uint256) {
        return 300_000_000 * 10**decimals();
    }

    function transfer(address, uint256) public pure override returns (bool) {
        revert('DISABLED');
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override returns (bool) {
        revert('DISABLED');
    }

    function approve(address, uint256) public pure override returns (bool) {
        revert('DISABLED');
    }

    function increaseAllowance(address, uint256) public pure override returns (bool) {
        revert('DISABLED');
    }

    function decreaseAllowance(address, uint256) public pure override returns (bool) {
        revert('DISABLED');
    }
}
