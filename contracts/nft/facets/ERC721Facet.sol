// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;
import '../libraries/ERC721Lib.sol';
import { UsingMintRole, MintRoleLib } from '../libraries/MintRoleLib.sol';
import '../../interfaces/IBeforeTokenTransfer.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

/// @notice Modern, minimalist, and gas efficient ERC-721 implementation. Based on Solmate (https://github.com/Rari-Capital/solmate/blob/main/src/tokens/ERC721.sol)
/// @author EIP2325 implementation by DefiCake (https://github.com/DefiCake), based on solmate. Additional features:
///             - onBeforeTokenTransfer hook

contract ERC721Facet is UsingMintRole {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Transfer(address indexed from, address indexed to, uint256 indexed id);

    event Approval(address indexed owner, address indexed spender, uint256 indexed id);

    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /*//////////////////////////////////////////////////////////////
                         METADATA STORAGE/LOGIC
    //////////////////////////////////////////////////////////////*/

    function name() public pure returns (string memory) {
        return 'RubyNFT';
    }

    function symbol() public pure returns (string memory) {
        return 'RUBY';
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(ERC721Lib.Storage()._ownerOf[tokenId] != address(0), 'NOT_MINTED');

        string memory prefix = 'https://deficake/';
        string memory customURI = ERC721Lib.Storage().tokenUri[tokenId];

        if (bytes(customURI).length == 0) return string(abi.encodePacked(prefix, Strings.toString(tokenId)));

        return string(abi.encodePacked(prefix, customURI));
    }

    /*//////////////////////////////////////////////////////////////
                      ERC721 BALANCE/OWNER STORAGE
    //////////////////////////////////////////////////////////////*/

    // mapping(uint256 => address) internal _ownerOf; => Moved to ERC721Lib.sol
    // mapping(address => uint256) internal _balanceOf; => Moved to ERC721Lib.sol

    function ownerOf(uint256 id) public view virtual returns (address owner) {
        require((owner = ERC721Lib.Storage()._ownerOf[id]) != address(0), 'NOT_MINTED');
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        require(owner != address(0), 'ZERO_ADDRESS');

        return ERC721Lib.Storage()._balanceOf[owner];
    }

    function totalSupply() public view returns (uint256) {
        return ERC721Lib.Storage().totalSupply;
    }

    /*//////////////////////////////////////////////////////////////
                         ERC721 APPROVAL STORAGE
    //////////////////////////////////////////////////////////////*/

    // mapping(uint256 => address) public getApproved; => Moved to ERC721Lib.sol
    // mapping(address => mapping(address => bool)) public isApprovedForAll; => Moved to ERC721Lib.sol

    function getApproved(uint256 id) public view returns (address) {
        return ERC721Lib.Storage().getApproved[id];
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return ERC721Lib.Storage().isApprovedForAll[owner][operator];
    }

    /*//////////////////////////////////////////////////////////////
                              ERC721 LOGIC
    //////////////////////////////////////////////////////////////*/

    function approve(address spender, uint256 id) public virtual {
        ERC721Lib.ERC721Storage storage s = ERC721Lib.Storage();

        address owner = s._ownerOf[id];

        require(msg.sender == owner || s.isApprovedForAll[owner][msg.sender], 'NOT_AUTHORIZED');

        s.getApproved[id] = spender;

        emit Approval(owner, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        ERC721Lib.Storage().isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(
        address from,
        address to,
        uint256 id
    ) public virtual {
        ERC721Lib.ERC721Storage storage s = ERC721Lib.Storage();

        require(from == s._ownerOf[id], 'WRONG_FROM');

        require(to != address(0), 'INVALID_RECIPIENT');

        require(
            msg.sender == from || s.isApprovedForAll[from][msg.sender] || msg.sender == s.getApproved[id],
            'NOT_AUTHORIZED'
        );

        IBeforeTokenTransfer(address(this)).beforeTokenTransfer(from, to, id);

        // Underflow of the sender's balance is impossible because we check for
        // ownership above and the recipient's balance can't realistically overflow.
        unchecked {
            s._balanceOf[from]--;

            s._balanceOf[to]++;
        }

        s._ownerOf[id] = to;

        delete s.getApproved[id];

        emit Transfer(from, to, id);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id
    ) public virtual {
        transferFrom(from, to, id);

        require(
            to.code.length == 0 ||
                IERC721Receiver(to).onERC721Received(msg.sender, from, id, '') ==
                IERC721Receiver.onERC721Received.selector,
            'UNSAFE_RECIPIENT'
        );
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes calldata data
    ) public virtual {
        transferFrom(from, to, id);

        require(
            to.code.length == 0 ||
                IERC721Receiver(to).onERC721Received(msg.sender, from, id, data) ==
                IERC721Receiver.onERC721Received.selector,
            'UNSAFE_RECIPIENT'
        );
    }

    /*//////////////////////////////////////////////////////////////
                              MINT LOGIC
    //////////////////////////////////////////////////////////////*/

    function mint(address to, uint256 id) external onlyMinter {
        _mint(to, id);
    }

    function safeMint(address to, uint256 id) external onlyMinter {
        _safeMint(to, id);
    }

    function safeMint(
        address to,
        uint256 id,
        bytes calldata data
    ) external onlyMinter {
        _safeMint(to, id, data);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL MINT/BURN LOGIC
    //////////////////////////////////////////////////////////////*/

    function _mint(address to, uint256 id) internal virtual {
        require(to != address(0), 'INVALID_RECIPIENT');

        ERC721Lib.ERC721Storage storage s = ERC721Lib.Storage();

        require(s._ownerOf[id] == address(0), 'ALREADY_MINTED');

        IBeforeTokenTransfer(address(this)).beforeTokenTransfer(address(0), to, id);

        // Counter overflow is incredibly unrealistic.
        unchecked {
            s.totalSupply++;
            s._balanceOf[to]++;
        }

        s._ownerOf[id] = to;

        emit Transfer(address(0), to, id);
    }

    /// @notice burn disabled
    // function _burn(uint256 id) internal virtual {
    //     ERC721Lib.ERC721Storage storage s = ERC721Lib.Storage();

    //     address owner = s._ownerOf[id];

    //     require(owner != address(0), 'NOT_MINTED');

    //     // Ownership check above ensures no underflow.
    //     unchecked {
    //         s.totalSupply--;
    //         s._balanceOf[owner]--;
    //     }

    //     delete s._ownerOf[id];

    //     delete s.getApproved[id];

    //     emit Transfer(owner, address(0), id);
    // }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL SAFE MINT LOGIC
    //////////////////////////////////////////////////////////////*/

    function _safeMint(address to, uint256 id) internal virtual {
        _mint(to, id);

        require(
            to.code.length == 0 ||
                IERC721Receiver(to).onERC721Received(msg.sender, address(0), id, '') ==
                IERC721Receiver.onERC721Received.selector,
            'UNSAFE_RECIPIENT'
        );
    }

    function _safeMint(
        address to,
        uint256 id,
        bytes calldata data
    ) internal virtual {
        _mint(to, id);

        require(
            to.code.length == 0 ||
                IERC721Receiver(to).onERC721Received(msg.sender, address(0), id, data) ==
                IERC721Receiver.onERC721Received.selector,
            'UNSAFE_RECIPIENT'
        );
    }
}
