// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;
import '../libraries/ERC721Lib.sol';
import '../../splitter/PaymentSplitterReporter.sol';

contract FeePoolFacet {
    address public immutable pool;

    constructor(address _pool) {
        pool = _pool;
    }

    function accrueRewards() external {}
}
