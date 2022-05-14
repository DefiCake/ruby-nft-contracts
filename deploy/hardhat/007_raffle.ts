import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MOCK_VRF_COORDINATOR, SIMPLE_RAFFLE_CONTRACT_NAME } from '../constants'
import { VRFCoordinatorV2Mock } from '../../typechain-types'
import { getAddress } from 'ethers/lib/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, execute },
    getNamedAccounts,
    ethers,
  } = hre

  const { deployer } = await getNamedAccounts()
  const vrfCoordinator = (await ethers.getContract(MOCK_VRF_COORDINATOR)) as VRFCoordinatorV2Mock

  const { blockNumber } = await execute(
    MOCK_VRF_COORDINATOR,
    { from: deployer, to: vrfCoordinator.address, log: true },
    'createSubscription'
  )
  const log = await vrfCoordinator
    .queryFilter(vrfCoordinator.filters.SubscriptionCreated(), blockNumber, blockNumber)
    .then((logs) => logs.find((log) => getAddress(log.args.owner) === getAddress(deployer)))
  if (!log) throw new Error(`Could not find log of Chainlink subscription creation`)

  const { subId } = log.args

  await deploy(SIMPLE_RAFFLE_CONTRACT_NAME, { from: deployer, log: true, args: [vrfCoordinator.address, subId] })
}

export default func
func.tags = ['raffle']
