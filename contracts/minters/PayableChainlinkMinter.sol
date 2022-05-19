// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/interfaces/IERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import '@rari-capital/solmate/src/utils/SafeTransferLib.sol';
import '../interfaces/Mintable.sol';

contract PayableChainlinkMinter is Ownable {
    uint8 private constant ETH_DECIMALS = 18;
    uint256 public immutable PRICE;

    address public immutable mintable;
    address public immutable oracle;

    constructor(
        address _mintable,
        address _oracle,
        uint256 _price
    ) {
        mintable = _mintable;
        oracle = _oracle;
        PRICE = _price * 10**8; // 8 decimals in standard USD/ETH LINK Oracle
    }

    modifier paysMint(uint256 amount) {
        uint256 mintCost = getMintCost(amount);
        require(mintCost <= msg.value, 'MINT_INSUFFICIENT_VALUE');
        _;

        uint256 remainder;
        unchecked {
            remainder = msg.value - mintCost;
        }

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

    function withdraw() external virtual onlyOwner {
        SafeTransferLib.safeTransferETH(msg.sender, address(this).balance);
    }

    function withdrawERC20(ERC20 token) external onlyOwner {
        SafeTransferLib.safeTransfer(token, msg.sender, token.balanceOf(address(this)));
    }

    function getMintCost(uint256 amountOfTokensToBuy) public view returns (uint256) {
        (, int256 link_usdethPrice, , , ) = AggregatorV3Interface(oracle).latestRoundData();
        require(link_usdethPrice > int256(0), 'LINK_PRICE_NEGATIVE');

        return ((amountOfTokensToBuy * PRICE) * 10**ETH_DECIMALS) / (uint256(link_usdethPrice));
    }
}
