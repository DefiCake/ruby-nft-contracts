import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction, FacetOptions } from 'hardhat-deploy/types'
import {
  NFT_CONTRACT_NAME,
  NFT_FACET_ERC721_NAME,
  NFT_FACET_FEE_POOL_NAME,
  NFT_FACET_MINTER_ROLE_NAME,
  SPLITTER_V1_CONTRACT_NAME,
} from '../constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { diamond },
    getNamedAccounts,
    ethers: { getContract },
  } = hre

  const { deployer } = await getNamedAccounts()

  const { address: splitterAddress } = await getContract(SPLITTER_V1_CONTRACT_NAME)

  const facets: Array<FacetOptions> = [
    { name: NFT_FACET_ERC721_NAME },
    { name: NFT_FACET_MINTER_ROLE_NAME },
    { name: NFT_FACET_FEE_POOL_NAME, args: [splitterAddress] },
  ]

  await diamond.deploy(NFT_CONTRACT_NAME, {
    from: deployer,
    owner: deployer,
    facets,
    log: true,
  })
}

export default func
func.tags = ['nft_facets_fee']
