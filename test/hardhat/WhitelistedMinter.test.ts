import { AddressZero, HashZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ContractTransaction, Wallet } from 'ethers'
import { hexlify, parseEther, randomBytes } from 'ethers/lib/utils'
import { ethers, timeAndMine } from 'hardhat'
import keccak256 from 'keccak256'
import MerkleTree from 'merkletreejs'
import {
  AggregatorMockV3,
  AggregatorV3Interface__factory,
  ERC20Mock,
  IRuby,
  WhitelistedMinter,
} from '../../typechain-types'
import { WhitelistedMinterFixture } from './fixtures/WhitelistedMinterFixture'

describe('WhitelistedMinter', () => {
  let ruby: IRuby
  let whitelistedMinter: WhitelistedMinter
  let erc20Mock: ERC20Mock
  let mockPriceOracle: AggregatorMockV3
  let deployer: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let mallory: SignerWithAddress
  let wallets: SignerWithAddress[]
  let merkleTree: MerkleTree

  beforeEach('fixture', async () => {
    ;({ deployer, alice, bob, mallory, whitelistedMinter, ruby, erc20Mock, mockPriceOracle, merkleTree, wallets } =
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
    const verifyMintingHappened = async (tx: ContractTransaction) => {
      const { blockNumber } = await tx.wait()
      const events = await ruby.queryFilter(ruby.filters.Transfer(), blockNumber, blockNumber)

      expect(events).to.have.length(1)
      const { args } = events[0]
      expect(args.from).to.be.equal(AddressZero)
      expect(args.to).to.be.equal(tx.from)
    }

    const getUsdEthPrice = async () => {
      return await whitelistedMinter
        .oracle()
        .then((oracle) => AggregatorV3Interface__factory.connect(oracle, ethers.provider).latestRoundData())
        .then(([, price]) => price)
    }

    describe('mint', () => {
      it('allows to mint to a whitelisted address', async () => {
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

      it('allows to mint multiple times', async () => {
        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await whitelistedMinter
          .connect(alice)
          .mint(proof, { value: parseEther('1') })
          .then(verifyMintingHappened)
        await whitelistedMinter
          .connect(alice)
          .mint(proof, { value: parseEther('1') })
          .then(verifyMintingHappened)

        expect(await ruby.ownerOf(0)).to.be.equal(alice.address)
        expect(await ruby.ownerOf(1)).to.be.equal(alice.address)
      })
      it('sets the sender status to verified', async () => {
        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await whitelistedMinter.connect(alice).mint(proof, { value: parseEther('1') })

        expect(await whitelistedMinter.verified(leaf)).to.be.equal(true)
      })

      it('rejects non-whitelisted address', async () => {
        const user = Wallet.createRandom().connect(ethers.provider)
        await deployer.sendTransaction({ to: user.address, value: parseEther('1') })

        const badLeaf = keccak256(user.address)
        const goodLeaf = keccak256(alice.address)

        const error = 'WHITELIST'

        await expect(whitelistedMinter.connect(user).mint(merkleTree.getHexProof(badLeaf))).to.be.revertedWith(error)
        await expect(whitelistedMinter.connect(user).mint(merkleTree.getHexProof(goodLeaf))).to.be.revertedWith(error)
      })

      it('accepts minting before timeout', async () => {
        const limit = await whitelistedMinter.LIMIT()
        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await timeAndMine.setTimeNextBlock(limit.toNumber() - 1)

        await whitelistedMinter
          .connect(alice)
          .mint(proof, { value: parseEther('1') })
          .then(verifyMintingHappened)
      })

      it('rejects if timeout', async () => {
        const limit = await whitelistedMinter.LIMIT()
        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await timeAndMine.setTimeNextBlock(limit.toNumber())

        await expect(whitelistedMinter.connect(alice).mint(proof, { value: parseEther('1') })).to.be.revertedWith(
          'TIMEOUT'
        )
      })

      it('rejects if insufficient value sent', async () => {
        const usdnft_price = await whitelistedMinter.PRICE()
        const usdeth_price = await getUsdEthPrice()

        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        const expectedWeiToPay = parseEther(usdnft_price.toString()).div(usdeth_price)

        await expect(
          whitelistedMinter.connect(alice).mint(proof, { value: expectedWeiToPay.sub(1) })
        ).to.be.revertedWith('MINT_INSUFFICIENT_VALUE')

        await whitelistedMinter.connect(alice).mint(proof, { value: expectedWeiToPay }).then(verifyMintingHappened)
      })

      it('rejects if root is uninitialized', async () => {
        await whitelistedMinter.connect(deployer).setRoot(HashZero)

        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await expect(whitelistedMinter.connect(alice).mint(proof, { value: parseEther('1') })).to.be.revertedWith(
          'MINTER_UNINITIALIZED'
        )
      })
    })

    describe('batchMint', () => {
      it('allows to mint to a whitelisted address', async () => {
        const usdnft_price = await whitelistedMinter.PRICE()
        const usdeth_price = await getUsdEthPrice()

        const nftsToMint = 1 + Math.floor(Math.random() * 10)

        const expectedWeiToPay = parseEther(usdnft_price.mul(nftsToMint).toString()).div(usdeth_price)

        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await whitelistedMinter.connect(alice).batchMint(proof, nftsToMint, { value: expectedWeiToPay })
        expect(await ruby.totalSupply()).to.be.equal(nftsToMint)
        expect(await ruby.balanceOf(alice.address)).to.be.equal(nftsToMint)
      })

      it('allows to mint multiple times', async () => {
        const usdnft_price = await whitelistedMinter.PRICE()
        const usdeth_price = await getUsdEthPrice()

        const nftsToMint = 1 + Math.floor(Math.random() * 10)

        const expectedWeiToPay = parseEther(usdnft_price.mul(nftsToMint).toString()).div(usdeth_price)

        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await whitelistedMinter.connect(alice).batchMint(proof, nftsToMint, { value: expectedWeiToPay })
        expect(await ruby.totalSupply()).to.be.equal(nftsToMint)
        expect(await ruby.balanceOf(alice.address)).to.be.equal(nftsToMint)

        await whitelistedMinter.connect(alice).batchMint(proof, nftsToMint, { value: expectedWeiToPay })
        expect(await ruby.totalSupply()).to.be.equal(nftsToMint * 2)
        expect(await ruby.balanceOf(alice.address)).to.be.equal(nftsToMint * 2)
      })

      it('sets the sender status to verified', async () => {
        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await whitelistedMinter.connect(alice).batchMint(proof, 1, { value: parseEther('1') })

        expect(await whitelistedMinter.verified(leaf)).to.be.equal(true)
      })

      it('rejects non-whitelisted address', async () => {
        const user = Wallet.createRandom().connect(ethers.provider)
        await deployer.sendTransaction({ to: user.address, value: parseEther('1') })

        const badLeaf = keccak256(user.address)
        const goodLeaf = keccak256(alice.address)

        const error = 'WHITELIST'

        await expect(whitelistedMinter.connect(user).batchMint(merkleTree.getHexProof(badLeaf), 1)).to.be.revertedWith(
          error
        )
        await expect(whitelistedMinter.connect(user).batchMint(merkleTree.getHexProof(goodLeaf), 1)).to.be.revertedWith(
          error
        )
      })

      it('accepts minting before timeout', async () => {
        const limit = await whitelistedMinter.LIMIT()
        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await timeAndMine.setTimeNextBlock(limit.toNumber() - 1)

        await whitelistedMinter
          .connect(alice)
          .batchMint(proof, 1, { value: parseEther('1') })
          .then(verifyMintingHappened)
      })

      it('rejects if timeout', async () => {
        const limit = await whitelistedMinter.LIMIT()
        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await timeAndMine.setTimeNextBlock(limit.toNumber())

        await expect(
          whitelistedMinter.connect(alice).batchMint(proof, 1, { value: parseEther('1') })
        ).to.be.revertedWith('TIMEOUT')
      })

      it('rejects if insufficient value sent', async () => {
        const usdnft_price = await whitelistedMinter.PRICE()
        const usdeth_price = await getUsdEthPrice()

        const nftsToMint = 1 + Math.floor(Math.random() * 10)

        const expectedWeiToPay = parseEther(usdnft_price.mul(nftsToMint).toString()).div(usdeth_price)

        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await expect(
          whitelistedMinter.connect(alice).batchMint(proof, nftsToMint, { value: expectedWeiToPay.sub(1) })
        ).to.be.revertedWith('MINT_INSUFFICIENT_VALUE')
      })

      it('rejects if root is uninitialized', async () => {
        await whitelistedMinter.connect(deployer).setRoot(HashZero)

        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await expect(
          whitelistedMinter.connect(alice).batchMint(proof, 1, { value: parseEther('1') })
        ).to.be.revertedWith('MINTER_UNINITIALIZED')
      })
    })

    describe('when oracle price is negative', () => {
      it('rejects mintings', async () => {
        await mockPriceOracle.setPrice(-1)

        const leaf = keccak256(alice.address)
        const proof = merkleTree.getHexProof(leaf)

        await expect(whitelistedMinter.connect(alice).mint(proof, { value: parseEther('1') })).to.be.revertedWith(
          'LINK_PRICE_NEGATIVE'
        )
      })
    })
  })

  describe('withdraw', () => {
    beforeEach('mint', async () => {
      const leaf = keccak256(alice.address)
      const proof = merkleTree.getHexProof(leaf)

      await whitelistedMinter.connect(alice).mint(proof, { value: parseEther('1') })
    })
    it('allows withdrawing to the owner', async () => {
      const balance = await ethers.provider.getBalance(whitelistedMinter.address)

      const tx = await whitelistedMinter.connect(deployer).withdraw()
      await expect(tx).to.changeEtherBalance(deployer, balance)
      await expect(tx).to.changeEtherBalance(whitelistedMinter, balance.mul(-1))
    })

    it('rejects withdrawing to non-owner', async () => {
      await expect(whitelistedMinter.connect(mallory).withdraw()).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('withdrawERC20', () => {
    const amount = 100
    beforeEach('mint', async () => {
      await erc20Mock.mint(whitelistedMinter.address, amount)
    })
    it('allows withdrawing to the owner', async () => {
      const balance = await erc20Mock.balanceOf(whitelistedMinter.address)

      const previousBalance = await erc20Mock.balanceOf(deployer.address)
      await whitelistedMinter.connect(deployer).withdrawERC20(erc20Mock.address)
      const balanceDelta = (await erc20Mock.balanceOf(deployer.address)).sub(previousBalance)

      expect(balanceDelta).to.be.equal(balance)
      expect(await erc20Mock.balanceOf(whitelistedMinter.address)).to.be.equal(0)
    })

    it('rejects withdrawing to non-owner', async () => {
      await expect(whitelistedMinter.connect(mallory).withdrawERC20(erc20Mock.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })
  })
})
