import { AddressZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import * as hre from 'hardhat'
import { SPLITTER_V1_CONTRACT_NAME } from '../deploy/constants'
import { IRuby, OwnedSplitterV1 } from '../typechain-types'
import { FeePoolFixture } from './fixtures/FeePoolFixture'
import { impersonate } from './utils/impersonate'

const { ethers } = hre

describe('FeePoolFacet', () => {
  let ruby: IRuby
  let splitter: OwnedSplitterV1
  let deployer: SignerWithAddress
  let mallory: SignerWithAddress

  beforeEach('fixture', async () => {
    ;({ ruby, splitter, deployer, mallory } = await FeePoolFixture())
  })

  describe('initialization', () => {
    it('correctly initializes pool to payment splitter', async () => {
      const { address } = await ethers.getContract(SPLITTER_V1_CONTRACT_NAME)
      expect(await ruby.pool()).to.be.equal(address)
    })
  })

  describe('beforeTokenTransfer', () => {
    it('can be called by diamond', async () => {
      const diamond = await impersonate(hre, ruby.address)
      await ruby.connect(diamond).beforeTokenTransfer(AddressZero, AddressZero, 0)
    })

    it('reverts when called by other address', async () => {
      await expect(ruby.connect(mallory).beforeTokenTransfer(AddressZero, AddressZero, 0)).to.be.revertedWith(
        'Only the diamond can call this'
      )
    })
  })

  describe('accrueRoyalties', () => {
    describe('when no nfts have been minted', () => {
      describe('if ETH has been forwarded', () => {
        it('does not accrue any royalties - direct send', async () => {
          const block = await ethers.provider.getBlockNumber()
          await ruby.connect(deployer).accrueRoyalties()

          const events = await ruby.queryFilter(ruby.filters.AccruedRoyalties(), block)
          expect(events).to.be.empty
        })

        it('does not accrue any royalties - splitter send')
      })
      describe('if no ETH has been forwarded', () => {})
    })
    describe('when nfts have been minted', () => {
      describe('if ETH has been forwarded', () => {})
      describe('if no ETH has been forwarded', () => {})
    })
  })
  describe('withdrawRoyalties', () => {})
})
