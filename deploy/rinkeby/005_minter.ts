import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { CHAINLINK_TESTNET_DATA, NFT_CONTRACT_NAME, OPEN_MINTER_CONTRACT_NAME } from '../constants'
import { IRuby } from '../../typechain-types'

const PRICE_PER_NFT = 10 // 10 USD per NFT

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, execute },
    ethers,
    getNamedAccounts,
  } = hre

  const { deployer } = await getNamedAccounts()

  const { chainlinkEthPriceFeed } = CHAINLINK_TESTNET_DATA['rinkeby']
  const nft = (await ethers.getContract(NFT_CONTRACT_NAME)) as IRuby

  const { address: minterAddress } = await deploy(OPEN_MINTER_CONTRACT_NAME, {
    from: deployer,
    log: true,
    args: [nft.address, chainlinkEthPriceFeed, PRICE_PER_NFT],
  })

  const owner = await nft.getMintRoleAdmin()
  await execute(NFT_CONTRACT_NAME, { from: owner, to: nft.address, log: true }, 'setMinter', minterAddress, true)
}

export default func
func.tags = ['minter']
