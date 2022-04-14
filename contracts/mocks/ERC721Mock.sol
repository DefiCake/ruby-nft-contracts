// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

import 'hardhat/console.sol';

contract ERC721Mock is ERC721('Mock', 'Mock') {
    function mint(address to, uint256 id) external {
        _mint(to, id);
    }
}
