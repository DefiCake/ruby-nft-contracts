// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @notice mock for chainlink price feeds
/// https://docs.chain.link/docs/ethereum-addresses/
/// https://docs.chain.link/docs/historical-price-data/
/// https://docs.chain.link/docs/get-the-latest-price/

contract AggregatorMockV3 {
    function decimals() external pure returns (uint8) {
        return 8;
    }

    /// @dev data from https://etherscan.io/address/0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419#readContract
    /// @notice data from ~ 2022 / 04 / 25  19:47 CEST
    //      [ latestRoundData method Response ]
    //      roundId   uint80 :  92233720368547780959
    //      answer   int256 :  293059734515 => 2930.59734515 USD / ETH
    //      startedAt   uint256 :  1650905759
    //      updatedAt   uint256 :  1650905759
    //      answeredInRound   uint80 :  92233720368547780959
    function latestRoundData()
        external
        pure
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (92233720368547780959, 293059734515, 1650905759, 1650905759, 92233720368547780959);
    }
}
