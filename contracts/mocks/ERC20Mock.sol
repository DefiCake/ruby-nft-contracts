// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import 'hardhat/console.sol';

contract ERC20Mock is ERC20('Mock', 'Mock') {
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
