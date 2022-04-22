// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IPaymentSplitter {
    function release(address payable) external;
}
