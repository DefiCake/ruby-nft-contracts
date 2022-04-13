// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import './IMinterRoleFacet.sol';
import './IERC721Facet.sol';

abstract contract IRuby is IERC721Facet, IMinterRoleFacet {}
