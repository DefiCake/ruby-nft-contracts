import { deployments } from 'hardhat'
import { generateMerkleTree } from '../../../deploy/merkletree'
import { AggregatorMockV3__factory, ERC20Mock__factory, WhitelistedMinter__factory } from '../../../typechain-types'
import { ERC721Fixture } from './ERC721Fixture'

export const WhitelistedMinterFixture = deployments.createFixture(async () => {
  const erc721Fixture = await ERC721Fixture()

  const {
    WhitelistedMinter: { address: whitelistedMinterAddress },
    ERC20Mock: { address: erc20MockAddress },
    AggregatorMockV3: { address: aggregatorMockV3Address },
  } = erc721Fixture.fixture

  const whitelistedMinter = WhitelistedMinter__factory.connect(whitelistedMinterAddress, erc721Fixture.deployer)
  await erc721Fixture.ruby.setMinter(whitelistedMinter.address, true)

  const whitelistedAddresses = erc721Fixture.wallets.map(({ address }) => address)
  const merkleTree = generateMerkleTree(whitelistedAddresses)

  await whitelistedMinter.setRoot(merkleTree.getRoot())

  const erc20Mock = ERC20Mock__factory.connect(erc20MockAddress, erc721Fixture.deployer)
  const mockPriceOracle = AggregatorMockV3__factory.connect(aggregatorMockV3Address, erc721Fixture.deployer)

  return { ...erc721Fixture, whitelistedMinter, erc20Mock, mockPriceOracle, whitelistedAddresses, merkleTree }
})
