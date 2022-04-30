// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '../libraries/MintRoleLib.sol';
import 'hardhat-deploy/solc_0.8/diamond/UsingDiamondOwner.sol';
import { IMinterRoleFacet } from '../interfaces/IMinterRoleFacet.sol';

contract MintRoleFacet is UsingDiamondOwner, IMinterRoleFacet {
    function setMinter(address addr, bool isMinter) external onlyOwner {
        MintRoleLib.Storage().isMinter[addr] = isMinter;
        emit MinterSet(addr, isMinter);
    }

    function getMinter(address addr) external view returns (bool) {
        return MintRoleLib.Storage().isMinter[addr];
    }

    function getMintRoleAdmin() external view returns (address) {
        return LibDiamond.diamondStorage().contractOwner;
    }
}
