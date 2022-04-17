// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;
import '../libraries/ERC721Lib.sol';
import '../../splitter/PaymentSplitterReporter.sol';

/// @notice Modern, minimalist, and gas efficient ERC-721 implementation. Based on Solmate (https://github.com/Rari-Capital/solmate/blob/main/src/tokens/ERC721.sol)
/// @author EIP2325 implementation by DefiCake (https://github.com/DefiCake), based on solmate

contract FeePoolFacet {
    address immutable pool;

    constructor(address _pool) {
        pool = _pool;
    }

    function accrueRewards() external {}
}
