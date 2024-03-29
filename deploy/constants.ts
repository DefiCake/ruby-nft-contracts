import { parseEther } from '@ethersproject/units'
import { FacetOptions } from 'hardhat-deploy/types'

export const NFT_CONTRACT_NAME = 'Ruby'
export const ERC20_CONTRACT_NAME = 'RubyToken'
export const SPLITTER_V1_CONTRACT_NAME = 'OwnedSplitterV1'
export const BOOMER_CONTRACT_NAME = 'Boomer'

export const NFT_FACET_ERC721_NAME = 'ERC721Facet'
export const NFT_FACET_MINTER_ROLE_NAME = 'MintRoleFacet'
export const NFT_FACET_FEE_POOL_NAME = 'FeePoolFacet'
export const NFT_FACET_URI_SETTER_V1_NAME = 'UriSetterFacetV1'

export const ERC165_FACET_NAME = 'ERC165Facet'
export const ERC2891_FACET_NAME = 'ERC2891Facet'

export const BASE_FACETS: Array<FacetOptions> = [
  { name: NFT_FACET_ERC721_NAME },
  { name: NFT_FACET_MINTER_ROLE_NAME },
  { name: ERC165_FACET_NAME },
  { name: NFT_FACET_URI_SETTER_V1_NAME },
]

export const SIMPLE_RAFFLE_CONTRACT_NAME = 'SimpleRaffle'

export const MOCK_MINTER_CONTRACT_NAME = 'MockMinter'
export const MOCK_ERC721_CONTRACT_NAME = 'ERC721Mock'
export const MOCK_CHAINLINK_ETH_PRICE_FEED = 'AggregatorMockV3'
export const MOCK_ERC20_CONTRACT_NAME = 'ERC20Mock'
export const MOCK_ETH_REJECTER = 'ETHRejecetMock'
export const MOCK_VRF_COORDINATOR = 'VRFCoordinatorV2Mock'

export const OPEN_MINTER_CONTRACT_NAME = 'OpenMinter'
export const WHITELIST_MINTER_CONTRACT_NAME = 'WhitelistedMinter'

export const PUBLIC_RESOLVER_CONTRACT_NAME = 'PublicResolver'

export const SCALE = parseEther('1') // 1e18 scale for precision improvement
export const ERC2891_FEE_SHARE = SCALE.mul(7).div(100)

export const DEV_WHITELIST = [
  '0x1ef5aB98912BB73c01C6846a9208475eaC6432bB',
  '0x5a94266794C960CD8EEdd0bb978773b4D386c5b3',
  '0xf52d417B1d402A9a7Ad961917F024f78d350d9E2',
  '0x2dF5FFeaa4545E5AaCEF1D7D7FdC68ac02f1F5c1',
  '0xA163d314F8a8b99aadCc469ee834d76F8807F1Bd',
  '0x5dFd182C27b836d93F23da18F7Eaa6deeC9C112c',
  '0x6d6b6Dc692a2CE0fEBE072A5124eA986C0B43762',
  '0xE5653Ed41f2bA3d01f4964b19763Ad7e669e7f82',
  '0x9F4d8678d521670050CcB2ec7E1DEa74E0C7C9f1',
  '0x68623ae776F9d6334b3CD8123d3B3A87587d3733',
  '0x7beb094890bA46D555E07f24F915dbb9893bECc1',
  '0x421637CC79A3fF608B4b5391d25298a937C663Be',
  '0x4C2712fCD16eEb4108861E9D8Dd107D5c736A20A',
  '0x0AE6936Ea5b9920DD62b1FAB3492c792334AB39b',
  '0xA7e8E9C82C4814066F2ffF9b97a9cA26B273B2BC',
  '0x9C860CA740acd584C396521df75c648523ceE239',
  '0x80790960915aa4F6B9b3CE3f8e29a462f5f97224',
  '0x2feF1839AC0a4B53E7DFD1308C3d8E9bff8b501f',
  '0x398B6a384aa1f59F11266C47aA766C52434f3Ea8',
  '0xAB16A0ac0bc41a540c28205D557A3864B7D3Dc46',
]

interface ChainlinkTestnetData {
  chainlinkEthPriceFeed: string
}

export const CHAINLINK_TESTNET_DATA: { [chain: string]: ChainlinkTestnetData } = {
  kovan: {
    chainlinkEthPriceFeed: '0x9326BFA02ADD2366b30bacB125260Af641031331',
  },
  rinkeby: {
    chainlinkEthPriceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
  },
}

export const ENS_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
export const ENS_PROJECT_PREFIX = 'ruby'
