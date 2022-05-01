import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { IRuby } from '../../typechain-types'
import { ERC721Fixture } from './fixtures/ERC721Fixture'
import { assertTransactionFailed } from './utils/assertTransactionFailed'

describe('MinterRoleFacet', () => {
  let ruby: IRuby
  let deployer: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  beforeEach('fixture', async () => {
    ;({ ruby, deployer, alice, bob } = await ERC721Fixture())
  })

  describe('setMinter', () => {
    it('reverts if called by non-owner', async () => {
      const tx = ruby.connect(alice).setMinter(bob.address, true)

      await assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith('Only owner is allowed to perform this action')
    })
    it('can authorize new minters', async () => {
      await expect(ruby.connect(deployer).setMinter(alice.address, true))
        .to.emit(ruby, 'MinterSet')
        .withArgs(alice.address, true)
      await expect(ruby.connect(deployer).setMinter(bob.address, true))
        .to.emit(ruby, 'MinterSet')
        .withArgs(bob.address, true)
    })
    it('can deauthorize minters', async () => {
      await expect(ruby.connect(deployer).setMinter(alice.address, false))
        .to.emit(ruby, 'MinterSet')
        .withArgs(alice.address, false)
      await expect(ruby.connect(deployer).setMinter(bob.address, false))
        .to.emit(ruby, 'MinterSet')
        .withArgs(bob.address, false)
    })
  })

  describe('getMinter', () => {
    it('correctly returns mint authorization', async () => {
      expect(await ruby.getMinter(alice.address)).to.be.equal(false)

      await ruby.connect(deployer).setMinter(alice.address, true)
      expect(await ruby.getMinter(alice.address)).to.be.equal(true)
      expect(await ruby.getMinter(bob.address)).to.be.equal(false)

      await ruby.connect(deployer).setMinter(alice.address, false)
      expect(await ruby.getMinter(alice.address)).to.be.equal(false)
    })
  })

  it('getMintRole', async () => {
    expect(await ruby.getMintRoleAdmin()).to.be.equal(deployer.address)
  })
})
