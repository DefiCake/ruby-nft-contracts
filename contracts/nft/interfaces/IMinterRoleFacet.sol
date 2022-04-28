// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IMinterRoleFacet {
    event MinterSet(address indexed addr, bool isMinter);

    function setMinter(address addr, bool isMinter) external;

    function getMinter(address addr) external view returns (bool);

    function getMintRoleAdmin() external view returns (address);
}
