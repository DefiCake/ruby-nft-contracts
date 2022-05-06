import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import {
  BOOMER_CONTRACT_NAME,
  MOCK_CHAINLINK_ETH_PRICE_FEED,
  MOCK_ERC721_CONTRACT_NAME,
  MOCK_MINTER_CONTRACT_NAME,
} from '../constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre

  const { deployer } = await getNamedAccounts()
  await deploy(MOCK_MINTER_CONTRACT_NAME, { from: deployer, log: true })
  await deploy(MOCK_ERC721_CONTRACT_NAME, { from: deployer, log: true })
  await deploy(BOOMER_CONTRACT_NAME, { from: deployer, log: true })
  await deploy(MOCK_CHAINLINK_ETH_PRICE_FEED, { from: deployer, log: true })
}

export default func
func.tags = ['mocks']
