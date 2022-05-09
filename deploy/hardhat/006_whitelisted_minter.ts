import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MOCK_CHAINLINK_ETH_PRICE_FEED, NFT_CONTRACT_NAME, WHITELIST_MINTER_CONTRACT_NAME } from '../constants'

const PRICE_PER_NFT = 10 // 10 USD per NFT
const ONE_YEAR_IN_SECONDS = 365 * 24 * 3600

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre

  const { deployer } = await getNamedAccounts()
  const { address: rubyAddress } = await getContract(NFT_CONTRACT_NAME)
  const { address: oracleAddress } = await getContract(MOCK_CHAINLINK_ETH_PRICE_FEED)

  const { timestamp } = await hre.ethers.provider.getBlock('latest')
  const timeLimit = timestamp + ONE_YEAR_IN_SECONDS
  await deploy(WHITELIST_MINTER_CONTRACT_NAME, {
    from: deployer,
    log: true,
    args: [timeLimit, rubyAddress, oracleAddress, PRICE_PER_NFT],
  })
}

export default func
func.tags = ['whitelisted_minter']
