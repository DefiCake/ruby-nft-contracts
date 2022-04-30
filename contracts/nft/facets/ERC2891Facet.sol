// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC2891Facet {
    address public immutable feeReceiver;
    uint256 public immutable feeNumerator;

    constructor(address _feeReceiver, uint256 _feeNumerator) {
        feeReceiver = _feeReceiver;
        feeNumerator = _feeNumerator;
    }

    /// @notice Called with the sale price to determine how much royalty
    //          is owed and to whom.
    /// @param _salePrice - the sale price of the NFT asset specified by _tokenId
    /// @return receiver - address of who should be sent the royalty payment
    /// @return royaltyAmount - the royalty payment amount for _salePrice
    function royaltyInfo(uint256, uint256 _salePrice) external view returns (address, uint256) {
        uint256 royaltyAmount = _salePrice * feeNumerator;
        assembly {
            royaltyAmount := div(royaltyAmount, 1000000000000000000)
        }
        return (feeReceiver, royaltyAmount);
    }
}
