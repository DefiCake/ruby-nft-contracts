// SPDX-License-Identifier: MIT

interface IMinterRoleFacet {
    event MinterSet(address indexed addr, bool isMinter);

    function setMinter(address addr, bool isMinter) external;

    function getMinter(address addr) external view returns (bool);
}
