import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MOCK_MINTER_CONTRACT_NAME } from '../constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre

  const { deployer } = await getNamedAccounts()
  await deploy(MOCK_MINTER_CONTRACT_NAME, { from: deployer, log: true })
}

export default func
func.tags = ['mocks']
