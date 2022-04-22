import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction, ProxyOptions } from 'hardhat-deploy/types'
import { NFT_CONTRACT_NAME, SPLITTER_V1_CONTRACT_NAME } from '../constants'
import { parseEther } from '@ethersproject/units'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre

  const { deployer } = await getNamedAccounts()
  const { address: nftAddress } = await getContract(NFT_CONTRACT_NAME)
  const shares = parseEther('0.5')

  const proxy: ProxyOptions = {
    proxyContract: 'OpenZeppelinTransparentProxy',
    owner: deployer,
    execute: {
      init: {
        methodName: 'initialize',
        args: [
          [deployer, nftAddress],
          [shares, shares],
        ],
      },
    },
  }

  await deploy(SPLITTER_V1_CONTRACT_NAME, { from: deployer, log: true, proxy })
  /**
   * @todo save proxy admin artifacts
   */
}

export default func
func.tags = ['nft_facets']
