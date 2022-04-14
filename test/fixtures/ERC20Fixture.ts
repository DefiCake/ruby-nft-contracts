import { deployments } from 'hardhat'
import { ERC721Mock__factory, ERC20__factory } from '../../typechain-types'

export const ERC20Fixture = deployments.createFixture(async ({ deployments, ethers }) => {
  const [deployer, alice, bob, carol, dave, mallory] = await ethers.getSigners()

  const {
    ERC721Mock: { address: erc721MockAddress },
    RubyToken: { address: erc20Address },
  } = await deployments.fixture()

  const erc721 = ERC721Mock__factory.connect(erc721MockAddress, deployer)
  const erc20 = ERC20__factory.connect(erc20Address, deployer)

  return { erc721, erc20, deployer, alice, bob, carol, dave, mallory }
})
