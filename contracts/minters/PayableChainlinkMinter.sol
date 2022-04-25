// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/interfaces/IERC721Enumerable.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import '@rari-capital/solmate/src/utils/SafeTransferLib.sol';
import '../interfaces/Mintable.sol';

contract PayableChainlinkMinter {
    uint8 private constant ETH_DECIMALS = 18;
    uint256 private constant PRICE = 1000 * 1e18;

    address immutable mintable;
    address immutable oracle;

    constructor(address _mintable, address _oracle) {
        mintable = _mintable;
        oracle = _oracle;
    }

    modifier paysMint(uint256 amount) {
        uint256 priceDecimals = AggregatorV3Interface(oracle).decimals();
        require(priceDecimals <= ETH_DECIMALS, 'LINK_INVALID_DECIMALS');
        (, int256 unscaledPrice, , , ) = AggregatorV3Interface(oracle).latestRoundData();
        require(unscaledPrice > int256(0), 'LINK_PRICE_NEGATIVE');

        uint256 mintCost = (uint256(unscaledPrice) * 10**(ETH_DECIMALS - priceDecimals));
        require(mintCost <= msg.value, 'MINT_INSUFFICIENT_VALUE');
        _;

        uint256 remainder = msg.value - mintCost;
        if (remainder > 0) {
            SafeTransferLib.safeTransferETH(msg.sender, remainder);
        }
    }

    function _mint(address to) internal virtual paysMint(1) {
        uint256 nextId = IERC721Enumerable(mintable).totalSupply();
        Mintable(mintable).mint(to, nextId);
    }

    function _batchMint(address to, uint256 amount) internal virtual paysMint(amount) {
        uint256 nextId = IERC721Enumerable(mintable).totalSupply();

        uint256 lim = nextId + amount;
        for (uint256 i = nextId; i < lim; ) {
            Mintable(mintable).mint(to, i);
            unchecked {
                ++i;
            }
        }
    }
}
