// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../interfaces/Mintable.sol';

contract MockMinter {
    function mint(
        address mintable,
        address to,
        uint256 id
    ) external {
        Mintable(mintable).mint(to, id);
    }
}
