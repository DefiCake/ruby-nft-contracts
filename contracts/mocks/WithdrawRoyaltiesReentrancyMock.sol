// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import '../nft/interfaces/IFeePoolFacet.sol';

contract WithdrawRoyaltiesReentrancyMock {
    event Rejected(string reason);

    receive() external payable virtual {
        try IFeePoolFacet(msg.sender).withdrawRoyalties() {} catch Error(string memory reason) {
            emit Rejected(reason);
        }
    }
}
