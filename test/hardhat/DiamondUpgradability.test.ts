import { AddressZero, HashZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import {
  IDiamondCut,
  IDiamondCut__factory,
  IRuby,
  MockFacetV2__factory,
  MockFacet__factory,
} from '../../typechain-types'
import { ERC721Fixture } from './fixtures/ERC721Fixture'
enum FacetCutAction {
  Add,
  Replace,
  Remove,
}
const EMPTY_BYTES = '0x'
describe.only('DiamondUpgradability', () => {
  let ruby: IRuby
  let diamond: IDiamondCut
  let deployer: SignerWithAddress
  let facetAddress: string

  const functionSelectors = [MockFacet__factory.getInterface(MockFacet__factory.abi).getSighash('version()')]

  beforeEach('fixture', async () => {
    ;({ ruby, deployer } = await ERC721Fixture())
    diamond = IDiamondCut__factory.connect(ruby.address, deployer)
    const mockFacet = await new MockFacet__factory(deployer).deploy()
    facetAddress = mockFacet.address
    await diamond.diamondCut(
      [{ facetAddress, action: FacetCutAction.Add, functionSelectors }],
      AddressZero,
      EMPTY_BYTES
    )
  })

  it('can upgrade - add facet', async () => {
    expect(await MockFacet__factory.connect(ruby.address, deployer).version()).to.be.equal(1)
  })

  it('can upgrade - remove facet', async () => {
    await diamond
      .connect(deployer)
      .diamondCut(
        [{ facetAddress: AddressZero, action: FacetCutAction.Remove, functionSelectors }],
        AddressZero,
        EMPTY_BYTES
      )

    await expect(MockFacet__factory.connect(ruby.address, deployer).version()).to.be.reverted
  })

  it('can upgrade - replace facet', async () => {
    const facetAddress = (await new MockFacetV2__factory(deployer).deploy()).address
    await diamond
      .connect(deployer)
      .diamondCut([{ facetAddress, action: FacetCutAction.Replace, functionSelectors }], AddressZero, EMPTY_BYTES)

    expect(await MockFacet__factory.connect(ruby.address, deployer).version()).to.be.equal(2)
  })
})
