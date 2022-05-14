// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

contract SimpleRaffle is VRFConsumerBaseV2 {
    event NumbersReceived(uint256[] numbers);
    bytes32 public constant keyHash = 0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93;
    address public immutable owner;
    address public immutable coordinator;
    uint64 public immutable subId;
    uint16 public constant minimumRequestConfirmations = 3;
    uint32 public constant callbackGasLimit = type(uint32).max;

    constructor(address _coordinator, uint64 _subId) VRFConsumerBaseV2(_coordinator) {
        owner = msg.sender;
        coordinator = _coordinator;
        subId = _subId;
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        emit NumbersReceived(randomWords);
    }

    function request(uint32 amount) external {
        require(msg.sender == owner, 'NOT_OWNER');

        VRFCoordinatorV2Interface(coordinator).requestRandomWords(
            keyHash,
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            amount
        );
    }
}
