import { deployments } from 'hardhat'
import { OwnedSplitterV1__factory } from '../../typechain-types'
import { ERC721Fixture } from './ERC721Fixture'

export const FeePoolFixture = deployments.createFixture(async ({ deployments, ethers }) => {
  const erc721Fixture = await ERC721Fixture()

  const {
    OwnedSplitter: { address: ownedSplitterAddress },
  } = erc721Fixture.fixture

  const splitter = OwnedSplitterV1__factory.connect(ownedSplitterAddress, erc721Fixture.deployer)

  return { ...erc721Fixture, splitter }
})
