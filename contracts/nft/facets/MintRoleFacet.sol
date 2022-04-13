// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import '../libraries/MintRoleLib.sol';
import { UsingDiamondOwner } from 'hardhat-deploy/solc_0.8/diamond/UsingDiamondOwner.sol';

contract MintRoleFacet is UsingDiamondOwner {
    event MinterSet(address indexed addr, bool isMinter);

    function setMinter(address addr, bool isMinter) external onlyOwner {
        MintRoleLib.Storage().isMinter[addr] = isMinter;
        emit MinterSet(addr, isMinter);
    }

    function getMinter(address addr) external view returns (bool) {
        return MintRoleLib.Storage().isMinter[addr];
    }
}
