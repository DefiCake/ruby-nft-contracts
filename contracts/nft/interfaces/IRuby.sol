// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import './IERC721Facet.sol';
import './IFeePoolFacet.sol';
import './IMinterRoleFacet.sol';
import './IERC2891.sol';

abstract contract IRuby is IERC721Facet, IERC2891, IFeePoolFacet, IMinterRoleFacet {}
