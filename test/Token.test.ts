import { AddressZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { ERC20, ERC721Mock, RubyToken, RubyToken__factory } from '../typechain-types'
import { ERC20Fixture } from './fixtures/ERC20Fixture'
import { assertTransactionFailed } from './utils/assertTransactionFailed'

const ERROR_DISABLED = 'DISABLED'
describe('RubyToken', () => {
  let erc20: ERC20
  let erc721: ERC721Mock
  let deployer: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress

  beforeEach('fixture', async () => {
    ;({ erc20, erc721, deployer, alice, bob } = await ERC20Fixture())
  })

  describe('transfer', () => {
    it('reverts', async () => {
      const tx = erc20.transfer(alice.address, 0)
      assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith(ERROR_DISABLED)
    })
  })

  describe('transferFrom', () => {
    it('reverts', async () => {
      const tx = erc20.transferFrom(alice.address, bob.address, 0)
      assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith(ERROR_DISABLED)
    })
  })

  describe('approve', () => {
    it('reverts', async () => {
      const tx = erc20.approve(alice.address, 0)
      assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith(ERROR_DISABLED)
    })
  })

  describe('increaseAllowance', () => {
    it('reverts', async () => {
      const tx = erc20.increaseAllowance(alice.address, 0)
      assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith(ERROR_DISABLED)
    })
  })

  describe('decreaseAllowance', () => {
    it('reverts', async () => {
      const tx = erc20.decreaseAllowance(alice.address, 0)
      assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith(ERROR_DISABLED)
    })
  })

  describe('balanceOf', () => {
    let token: RubyToken

    beforeEach('link erc721', async () => {
      token = RubyToken__factory.connect(erc20.address, deployer)
      await token.setNFT(erc721.address)
    })

    it('correctly increases erc20 balance as erc721 balance increases', async () => {
      expect(await token.balanceOf(alice.address)).to.be.equal(0)

      await erc721.mint(alice.address, 0)
      expect(await token.balanceOf(alice.address)).to.be.equal(parseEther('1000'))

      await erc721.mint(alice.address, 1)
      expect(await token.balanceOf(alice.address)).to.be.equal(parseEther('2000'))

      await erc721.connect(alice).transferFrom(alice.address, bob.address, 0)
      expect(await token.balanceOf(alice.address)).to.be.equal(parseEther('1000'))
      expect(await token.balanceOf(bob.address)).to.be.equal(parseEther('1000'))
    })
  })

  describe('totalSupply()', () => {
    it('correctly prints 300_000_000 tokens', async () => {
      const supply = 300_000_000
      expect(await erc20.totalSupply()).to.be.equal(parseEther(supply.toString()))
    })
  })

  describe('setNFT()', () => {
    it('correctly sets nft address', async () => {
      const token = RubyToken__factory.connect(erc20.address, deployer)

      expect(await token.nft()).to.be.equal(AddressZero)
      await token.setNFT(erc721.address)
      expect(await token.nft()).to.be.equal(erc721.address)
    })

    it('can only be called by the owner', async () => {
      const token = RubyToken__factory.connect(erc20.address, deployer)
      expect(await token.nft()).to.be.equal(AddressZero)

      const tx = token.connect(alice).setNFT(erc721.address)
      await assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner')

      await token.connect(deployer).transferOwnership(alice.address)

      await token.connect(alice).setNFT(erc721.address)
      expect(await token.nft()).to.be.equal(erc721.address)
    })
  })
})
