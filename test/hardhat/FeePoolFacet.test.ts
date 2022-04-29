import { AddressZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import * as hre from 'hardhat'
import { SPLITTER_V1_CONTRACT_NAME } from '../../deploy/constants'
import { IRuby, MockMinter, OwnedSplitterV1 } from '../../typechain-types'
import { FeePoolFixture } from './fixtures/FeePoolFixture'
import { impersonate } from './utils/impersonate'

const { ethers } = hre

const ONE_ETH = parseEther('1')
const PRECISION_SCALE = parseEther('1')

describe('FeePoolFacet', () => {
  let ruby: IRuby
  let splitter: OwnedSplitterV1
  let deployer: SignerWithAddress
  let alice: SignerWithAddress
  let mallory: SignerWithAddress
  let minter: MockMinter

  // Some splitter invariants
  let rubyShares: BigNumber
  let totalShares: BigNumber

  before('splitter data', async () => {
    const { ruby, splitter } = await FeePoolFixture()
    rubyShares = await splitter.shares(ruby.address)
    totalShares = await splitter.totalShares()
  })

  beforeEach('fixture', async () => {
    ;({ ruby, splitter, deployer, minter, alice, mallory } = await FeePoolFixture())
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

    it('updates user balance')
  })

  describe('accrueRoyalties', () => {
    describe('when no nfts have been minted', () => {
      describe('if ETH has been forwarded', () => {
        it('does not accrue any royalties - direct send', async () => {
          const block = await ethers.provider.getBlockNumber()
          await deployer.sendTransaction({ to: ruby.address, value: ONE_ETH })
          await ruby.connect(deployer).accrueRoyalties()

          const events = await ruby.queryFilter(ruby.filters.AccruedRoyalties(), block)
          expect(events).to.be.empty
        })

        it('does not accrue any royalties - splitter send', async () => {
          const block = await ethers.provider.getBlockNumber()
          await deployer.sendTransaction({ to: splitter.address, value: ONE_ETH })

          await ruby.connect(deployer).accrueRoyalties()

          const events = await ruby.queryFilter(ruby.filters.AccruedRoyalties(), block)
          expect(events).to.be.empty
        })
      })
      describe('if no ETH has been forwarded', () => {
        it('does not accrue any royalties', async () => {
          const block = await ethers.provider.getBlockNumber()
          await ruby.connect(deployer).accrueRoyalties()

          const events = await ruby.queryFilter(ruby.filters.AccruedRoyalties(), block)
          expect(events).to.be.empty
        })
      })
    })
    describe('when nfts have been minted', () => {
      describe('when ETH has been previously forwarded', () => {
        describe('to the splitter', () => {
          const totalWeiValue = ONE_ETH
          beforeEach('send eth to the splitter', async () => {
            await deployer.sendTransaction({ to: splitter.address, value: totalWeiValue })
          })

          describe('with a single minter and a single token', () => {
            it('gives the whole ruby share to the first minter', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await ruby.accrueRoyalties()
              const royalties = await ruby.connect(alice).callStatic.withdrawRoyalties()
              expect(royalties).to.be.equal(totalWeiValue.mul(rubyShares).div(totalShares))
            })

            it('emits an AccruedRoyalties event with the expected params', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              const tx = await ruby.accrueRoyalties()

              const globalEarnedWei = totalWeiValue.mul(rubyShares).div(totalShares)
              const accruedWeiPerShare = globalEarnedWei.mul(PRECISION_SCALE)
              await expect(tx)
                .to.emit(ruby, 'AccruedRoyalties')
                .withArgs(globalEarnedWei, accruedWeiPerShare, globalEarnedWei)
            })

            it('correctly updates lastCheckpoint', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await ruby.accrueRoyalties()

              const lastCheckpoint = await ruby.getCurrentCheckpoint()
              expect(lastCheckpoint).to.be.equal(totalWeiValue.mul(rubyShares).div(totalShares))
            })
          })

          describe('with a single minter and multiple tokens', () => {
            it('pending')
          })

          describe('with multiple minters and multiple tokens', () => {
            it('pending')
          })
        })

        describe('to the ruby', () => {})

        it('single minter', async () => {})
      })
      describe('when no ETH has been previously forwarded', () => {})
    })
  })
  describe('withdrawRoyalties', () => {})
})
