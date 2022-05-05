import { deployments } from 'hardhat'
import { generateMerkleTree } from '../../../deploy/merkletree'
import { WhitelistedMinter__factory } from '../../../typechain-types'
import { ERC721Fixture } from './ERC721Fixture'

export const WhitelistedMinterFixture = deployments.createFixture(async () => {
  const erc721Fixture = await ERC721Fixture()

  const {
    WhitelistedMinter: { address: whitelistedMinterAddress },
  } = erc721Fixture.fixture

  const whitelistedMinter = WhitelistedMinter__factory.connect(whitelistedMinterAddress, erc721Fixture.deployer)
  await erc721Fixture.ruby.setMinter(whitelistedMinter.address, true)

  const whitelistedAddresses = erc721Fixture.wallets.map(({ address }) => address)
  const merkleTree = generateMerkleTree(whitelistedAddresses)

  await whitelistedMinter.setRoot(merkleTree.getRoot())

  return { ...erc721Fixture, whitelistedMinter, whitelistedAddresses, merkleTree }
})
