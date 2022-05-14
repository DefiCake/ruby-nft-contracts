import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import {
  BOOMER_CONTRACT_NAME,
  MOCK_CHAINLINK_ETH_PRICE_FEED,
  MOCK_ERC20_CONTRACT_NAME,
  MOCK_ERC721_CONTRACT_NAME,
  MOCK_ETH_REJECTER,
  MOCK_MINTER_CONTRACT_NAME,
  MOCK_VRF_COORDINATOR,
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
  await deploy(MOCK_ERC20_CONTRACT_NAME, { from: deployer, log: true })
  await deploy(MOCK_ETH_REJECTER, { from: deployer, log: true })
  await deploy(MOCK_VRF_COORDINATOR, { from: deployer, log: true, args: [1, 1] })
}

export default func
func.tags = ['mocks']
