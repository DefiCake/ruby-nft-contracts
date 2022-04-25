import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { CHAINLINK_TESTNET_DATA, NFT_CONTRACT_NAME, OPEN_MINTER_CONTRACT_NAME } from '../constants'
import { ethers } from 'hardhat'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
  } = hre

  const { deployer } = await getNamedAccounts()

  const { chainlinkEthPriceFeed } = CHAINLINK_TESTNET_DATA['kovan']
  const { address: nftAddress } = await ethers.getContract(NFT_CONTRACT_NAME)

  await deploy(OPEN_MINTER_CONTRACT_NAME, { from: deployer, log: true, args: [nftAddress, chainlinkEthPriceFeed] })
  /**
   * @todo save proxy admin artifacts
   */
}

export default func
func.tags = ['minter']
