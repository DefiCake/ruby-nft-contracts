import { deployments } from 'hardhat'
import { IRuby__factory, MockMinter__factory } from '../../typechain-types'

export const ERC721Fixture = deployments.createFixture(async ({ deployments, ethers }) => {
  const {
    Ruby: { address: rubyAddress },
    MockMinter: { address: mockMinter },
  } = await deployments.fixture()
  const [deployer, alice, bob, carol, dave, mallory] = await ethers.getSigners()
  const ruby = IRuby__factory.connect(rubyAddress, deployer)
  const minter = MockMinter__factory.connect(mockMinter, deployer)

  await ruby.setMinter(deployer.address, true)
  await ruby.setMinter(mockMinter, true)

  return { ruby, minter, deployer, alice, bob, carol, dave, mallory }
})
