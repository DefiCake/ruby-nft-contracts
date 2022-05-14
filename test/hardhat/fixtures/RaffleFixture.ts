import { deployments } from 'hardhat'
import { SimpleRaffle__factory, VRFCoordinatorV2Mock__factory } from '../../../typechain-types'
import { ERC721Fixture } from './ERC721Fixture'

export const RaffleFixture = deployments.createFixture(async ({ deployments, ethers }) => {
  const erc721Fixture = await ERC721Fixture()

  const {
    SimpleRaffle: { address: simpleRaffleAddress },
    VRFCoordinatorV2Mock: { address: coordinatorAddress },
  } = await deployments.fixture()
  const [deployer, alice] = await ethers.getSigners()

  const raffle = SimpleRaffle__factory.connect(simpleRaffleAddress, deployer)
  const coordinator = VRFCoordinatorV2Mock__factory.connect(coordinatorAddress, deployer)
  return { deployer, alice, raffle, coordinator }
})
