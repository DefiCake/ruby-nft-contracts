// SPDX-License-Identifier: MIT

interface IMinterRoleFacet {
    function setMinter(address addr, bool isMinter) external;

    function getMinter(address addr) external view returns (bool);
}
