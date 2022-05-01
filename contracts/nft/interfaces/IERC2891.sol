// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IERC2891 {
    function royaltyInfo(uint256 tokenId, uint256 _salePrice)
        external
        view
        returns (address receiver, uint256 feeAmount);
}
