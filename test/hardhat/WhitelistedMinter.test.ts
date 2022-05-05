import { AddressZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ContractTransaction, Wallet } from 'ethers'
import { hexlify, parseEther, randomBytes } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import keccak256 from 'keccak256'
import MerkleTree from 'merkletreejs'
import { IRuby, WhitelistedMinter } from '../../typechain-types'
import { WhitelistedMinterFixture } from './fixtures/WhitelistedMinterFixture'

describe.only('WhitelistedMinter', () => {
  let ruby: IRuby
  let whitelistedMinter: WhitelistedMinter
  let deployer: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let mallory: SignerWithAddress
  let wallets: SignerWithAddress[]
  let merkleTree: MerkleTree

  beforeEach('fixture', async () => {
    ;({ deployer, alice, bob, mallory, whitelistedMinter, ruby, merkleTree, wallets } =
      await WhitelistedMinterFixture())
  })

  describe('setRoot', () => {
    it('allows the owner to set a root', async () => {
      expect(await whitelistedMinter.owner()).to.be.equal(deployer.address)
      const randomRoot = hexlify(randomBytes(32))
      await whitelistedMinter.connect(deployer).setRoot(randomRoot)
      expect(await whitelistedMinter.root()).to.be.equal(randomRoot)
    })

    it('rejects non-owner calls', async () => {
      const randomRoot = hexlify(randomBytes(32))
      await expect(whitelistedMinter.connect(mallory).setRoot(randomRoot)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('mintings', () => {
    describe('mint', () => {
      it('allows to mint to a whitelisted address', async () => {
        const verifyMintingHappened = async (tx: ContractTransaction) => {
          const { blockNumber } = await tx.wait()
          const events = await ruby.queryFilter(ruby.filters.Transfer(), blockNumber, blockNumber)

          expect(events).to.have.length(1)
          const { args } = events[0]
          expect(args.from).to.be.equal(AddressZero)
          expect(args.to).to.be.equal(tx.from)
        }

        await Promise.all(
          wallets.map(async (wallet) => {
            const leaf = keccak256(wallet.address)
            const proof = merkleTree.getHexProof(leaf)

            return whitelistedMinter
              .connect(wallet)
              .mint(proof, { value: parseEther('1'), gasLimit: 1_000_000 })
              .then(verifyMintingHappened)
          })
        )
      })

      it('allows to mint multiple times')
      it('sets the sender status to verified')

      it('rejects non-whitelisted address', async () => {
        const user = Wallet.createRandom().connect(ethers.provider)
        await deployer.sendTransaction({ to: user.address, value: parseEther('1') })

        const badLeaf = keccak256(user.address)
        const goodLeaf = keccak256(alice.address)

        await expect(whitelistedMinter.connect(user).mint(merkleTree.getHexProof(badLeaf))).to.be.revertedWith(
          'WHITELIST'
        )
        await expect(whitelistedMinter.connect(user).mint(merkleTree.getHexProof(goodLeaf))).to.be.revertedWith(
          'WHITELIST'
        )
      })

      it('rejects if timeout')
    })

    describe('batchMint', () => {
      it('pending')
    })
  })

  describe('withdraw', () => {
    it('pending')
  })
})
