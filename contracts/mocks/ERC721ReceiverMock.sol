// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'hardhat/console.sol';

/// @notice https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/b0cf6fbb7a70f31527f36579ad644e1cf12fdf4e/contracts/mocks/ERC721ReceiverMock.sol
contract ERC721ReceiverMock {
    enum Error {
        None,
        RevertWithMessage,
        RevertWithoutMessage,
        Panic
    }

    bytes4 private immutable _retval;
    Error private immutable _error;

    event Received(address operator, address from, uint256 tokenId, bytes data);

    constructor(bytes4 retval, Error error) {
        _retval = retval;
        _error = error;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public returns (bytes4) {
        if (_error == Error.RevertWithMessage) {
            revert('ERC721ReceiverMock: reverting');
        } else if (_error == Error.RevertWithoutMessage) {
            revert();
        } else if (_error == Error.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }
        emit Received(operator, from, tokenId, data);
        return _retval;
    }
}
