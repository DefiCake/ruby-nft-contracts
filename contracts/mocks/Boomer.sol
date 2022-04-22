// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

contract Boomer {
    function boom(address payable to) public payable {
        new Boom{ value: msg.value }(to);
    }
}

contract Boom {
    constructor(address payable to) payable {
        selfdestruct(to);
    }
}
