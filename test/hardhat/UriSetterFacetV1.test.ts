import { BigNumber } from '@ethersproject/bignumber'
import { HashZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { AbiCoder, hexlify, randomBytes, solidityKeccak256, solidityPack } from 'ethers/lib/utils'
import keccak256 from 'keccak256'
import MerkleTree from 'merkletreejs'
import { generateGenericMerkleTree } from '../../deploy/merkletree'
import { IRuby, MockMinter } from '../../typechain-types'
import { ERC721Fixture } from './fixtures/ERC721Fixture'

describe('UriSetterFacetV1', () => {
  let ruby: IRuby
  let minter: MockMinter
  let deployer: SignerWithAddress
  let alice: SignerWithAddress
  let mallory: SignerWithAddress

  beforeEach('fixture', async () => {
    ;({ ruby, deployer, alice, mallory, minter } = await ERC721Fixture())
  })

  describe('uriSetterV1SetRoot', () => {
    it('can only be called by the owner', async () => {
      await expect(ruby.connect(mallory).uriSetterV1SetRoot(HashZero)).to.be.revertedWith(
        'Only owner is allowed to perform this action'
      )
    })

    it('sets the root', async () => {
      const random = hexlify(randomBytes(32))
      await ruby.connect(deployer).uriSetterV1SetRoot(random)

      expect(await ruby.getUriSetterV1Root()).to.be.equal(random)
    })
  })

  describe('uriSetterV1SetTokenURI', () => {
    it('allows the user to set a revealed URI', async () => {
      const firstTokenId = BigNumber.from(1)
      const customUri = 'CUSTOM_URI'

      const secondTokenId = BigNumber.from(2)

      await minter.mint(ruby.address, alice.address, firstTokenId)
      await minter.mint(ruby.address, alice.address, secondTokenId)

      const encodedLeaves = [
        solidityPack(['uint', 'string'], [firstTokenId, customUri]),
        solidityPack(['uint', 'string'], [secondTokenId, customUri]),
      ]

      const tree = generateGenericMerkleTree(encodedLeaves)

      const root = tree.getHexRoot()
      const proof = tree.getHexProof(keccak256(encodedLeaves[0]))

      await ruby.connect(deployer).uriSetterV1SetRoot(root)

      await ruby.connect(alice).uriSetterV1SetTokenURI(firstTokenId, customUri, proof)
      expect(await ruby.tokenURI(firstTokenId)).to.be.contain(customUri)

      expect(await ruby.uriSetterV1IsSet(firstTokenId)).to.be.equal(true)
      expect(await ruby.uriSetterV1IsSet(secondTokenId)).to.be.equal(false)
    })

    it('rejects if trying to set the URI twice', async () => {
      const firstTokenId = BigNumber.from(1)
      const customUri = 'CUSTOM_URI'

      const secondTokenId = BigNumber.from(2)

      await minter.mint(ruby.address, alice.address, firstTokenId)
      await minter.mint(ruby.address, alice.address, secondTokenId)

      const encodedLeaves = [
        solidityPack(['uint', 'string'], [firstTokenId, customUri]),
        solidityPack(['uint', 'string'], [secondTokenId, customUri]),
      ]

      const tree = generateGenericMerkleTree(encodedLeaves)

      const root = tree.getHexRoot()
      const proof = tree.getHexProof(keccak256(encodedLeaves[0]))

      await ruby.connect(deployer).uriSetterV1SetRoot(root)

      await ruby.connect(alice).uriSetterV1SetTokenURI(firstTokenId, customUri, proof)
      await expect(ruby.connect(alice).uriSetterV1SetTokenURI(firstTokenId, customUri, proof)).to.be.revertedWith(
        'ALREADY_SET'
      )
    })

    it('rejects if called by a non-owner of tokenId', async () => {
      const firstTokenId = BigNumber.from(1)
      const customUri = 'CUSTOM_URI'

      const secondTokenId = BigNumber.from(2)

      await minter.mint(ruby.address, alice.address, firstTokenId)
      await minter.mint(ruby.address, alice.address, secondTokenId)

      const encodedLeaves = [
        solidityPack(['uint', 'string'], [firstTokenId, customUri]),
        solidityPack(['uint', 'string'], [secondTokenId, customUri]),
      ]

      const tree = generateGenericMerkleTree(encodedLeaves)

      const root = tree.getHexRoot()
      const proof = tree.getHexProof(keccak256(encodedLeaves[0]))

      await ruby.connect(deployer).uriSetterV1SetRoot(root)

      await expect(ruby.connect(mallory).uriSetterV1SetTokenURI(firstTokenId, customUri, proof)).to.be.revertedWith(
        'NOT_AUTHORIZED'
      )
    })

    it('rejects if passed a bad proof', async () => {
      const firstTokenId = BigNumber.from(1)
      const customUri = 'CUSTOM_URI'
      const badUri = 'BAD_URI'
      const secondTokenId = BigNumber.from(2)

      await minter.mint(ruby.address, alice.address, firstTokenId)
      await minter.mint(ruby.address, alice.address, secondTokenId)

      const encodedLeaves = [
        solidityPack(['uint', 'string'], [firstTokenId, customUri]),
        solidityPack(['uint', 'string'], [secondTokenId, customUri]),
      ]

      const tree = generateGenericMerkleTree(encodedLeaves)

      const root = tree.getHexRoot()
      const proof = tree.getHexProof(keccak256(encodedLeaves[0]))

      await ruby.connect(deployer).uriSetterV1SetRoot(root)

      await expect(ruby.connect(alice).uriSetterV1SetTokenURI(firstTokenId, badUri, proof)).to.be.revertedWith(
        'BAD_PROOF'
      )

      await expect(ruby.connect(alice).uriSetterV1SetTokenURI(secondTokenId, customUri, proof)).to.be.revertedWith(
        'BAD_PROOF'
      )
    })

    it('rejects if token ID does not exist', async () => {
      await ruby.connect(deployer).uriSetterV1SetRoot(hexlify(randomBytes(32)))
      await expect(ruby.connect(alice).uriSetterV1SetTokenURI(1, 'customuri', [])).to.be.revertedWith('NOT_AUTHORIZED')
    })

    it('rejects if root is not set', async () => {
      const tokenId = 1
      await minter.mint(ruby.address, alice.address, tokenId)
      await expect(ruby.connect(alice).uriSetterV1SetTokenURI(tokenId, 'customuri', [])).to.be.revertedWith(
        'ROOT_UNINITIALIZED'
      )
    })
  })
})
