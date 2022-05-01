// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

import './IERC721Facet.sol';
import './IFeePoolFacet.sol';
import './IMinterRoleFacet.sol';
import './IERC2891.sol';

abstract contract IRuby is IERC721Facet, IERC2891, IFeePoolFacet, IMinterRoleFacet {}
