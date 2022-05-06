import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MOCK_CHAINLINK_ETH_PRICE_FEED, NFT_CONTRACT_NAME, WHITELIST_MINTER_CONTRACT_NAME } from '../constants'
import { MaxUint256 } from '@ethersproject/constants'

const PRICE_PER_NFT = 10 // 10 USD per NFT
const TIME_LIMIT = MaxUint256

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    ethers: { getContract },
  } = hre

  const { deployer } = await getNamedAccounts()
  const { address: rubyAddress } = await getContract(NFT_CONTRACT_NAME)
  const { address: oracleAddress } = await getContract(MOCK_CHAINLINK_ETH_PRICE_FEED)

  await deploy(WHITELIST_MINTER_CONTRACT_NAME, {
    from: deployer,
    log: true,
    args: [TIME_LIMIT, rubyAddress, oracleAddress, PRICE_PER_NFT],
  })
}

export default func
func.tags = ['whitelisted_minter']
