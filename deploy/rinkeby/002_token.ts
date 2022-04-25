import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction, ProxyOptions } from 'hardhat-deploy/types'
import { ERC20_CONTRACT_NAME, NFT_CONTRACT_NAME, NFT_FACET_ERC721_NAME, NFT_FACET_MINTER_ROLE_NAME } from '../constants'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre

  const { deployer } = await getNamedAccounts()

  const proxy: ProxyOptions = {
    proxyContract: 'OpenZeppelinTransparentProxy',
    owner: deployer,
    execute: {
      init: {
        methodName: 'initialize',
        args: [],
      },
    },
  }

  const { address } = await deploy(ERC20_CONTRACT_NAME, { from: deployer, log: true, proxy })
  /**
   * @todo save proxy admin artifacts
   */
}

export default func
func.tags = ['token']
