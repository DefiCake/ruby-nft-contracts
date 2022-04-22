// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface Mintable {
    function mint(address to, uint256) external;

    function safeMint(address to, uint256 id) external;

    function safeMint(
        address to,
        uint256 id,
        bytes calldata data
    ) external;
}
