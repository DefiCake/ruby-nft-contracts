// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@rari-capital/solmate/src/tokens/ERC721.sol';
import '../../interfaces/Mintable.sol';

abstract contract IERC721Facet is ERC721, Mintable {
    function totalSupply() external view virtual returns (uint256);
}
