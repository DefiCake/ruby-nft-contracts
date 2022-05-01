import { AddressZero } from '@ethersproject/constants'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import hre from 'hardhat'
import { SCALE, SPLITTER_V1_CONTRACT_NAME } from '../../deploy/constants'
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
  let bob: SignerWithAddress
  let carol: SignerWithAddress
  let mallory: SignerWithAddress
  let minter: MockMinter

  // Some splitter invariants
  let rubySplitterShares: BigNumber
  let totalSplitterShares: BigNumber

  before('splitter data', async () => {
    const { ruby, splitter } = await FeePoolFixture()
    rubySplitterShares = await splitter.shares(ruby.address)
    totalSplitterShares = await splitter.totalShares()
  })

  beforeEach('fixture', async () => {
    const fixture = await FeePoolFixture()
    ;({ ruby, splitter, minter } = fixture)
    ;[deployer, alice, bob, carol, mallory] = fixture.wallets
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

    it('updates user balance', async () => {
      const firstTokenId = 1
      const secondTokenId = 2
      const value = ONE_ETH
      await ruby.connect(deployer).mint(alice.address, firstTokenId)
      await deployer.sendTransaction({ to: ruby.address, value })
      await ruby.connect(deployer).mint(bob.address, secondTokenId) // this should accrue royalties
      await deployer.sendTransaction({ to: ruby.address, value })

      const tx = await ruby.connect(alice).transferFrom(alice.address, bob.address, firstTokenId)
      const { accruedWeiPerShare } = await ruby.callStatic.getCurrentFeeGlobals()

      const aliceExpectedEarnings = ONE_ETH.add(ONE_ETH.div(2))
      const bobExpectedEarnings = ONE_ETH.div(2)
      const expectedDebt = accruedWeiPerShare

      await expect(tx)
        .to.emit(ruby, 'LockerUpdated')
        .withArgs(alice.address, aliceExpectedEarnings, 0, aliceExpectedEarnings, expectedDebt)
      await expect(tx)
        .to.emit(ruby, 'LockerUpdated')
        .withArgs(bob.address, bobExpectedEarnings, ONE_ETH.mul(SCALE), bobExpectedEarnings, expectedDebt)
    })
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
          let totalWeiValue: BigNumber
          let totalWeiValueInRuby: BigNumber

          const sendOneEthToSplitter = async () => {
            await deployer.sendTransaction({ to: splitter.address, value: ONE_ETH })
            totalWeiValueInRuby = totalWeiValueInRuby.add(ONE_ETH.mul(rubySplitterShares).div(totalSplitterShares))
            totalWeiValue = totalWeiValue.add(ONE_ETH)
          }

          beforeEach('send eth to the splitter', async () => {
            totalWeiValue = BigNumber.from(0)
            totalWeiValueInRuby = BigNumber.from(0)
            await sendOneEthToSplitter()
          })

          describe('with a single minter and a single token', () => {
            it('gives the whole ruby share to the first minter', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await ruby.accrueRoyalties()
              const royalties = await ruby.connect(alice).callStatic.withdrawRoyalties()
              expect(royalties).to.be.equal(totalWeiValueInRuby)
            })

            it('emits an AccruedRoyalties event with the expected params', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              const tx = await ruby.accrueRoyalties()

              const globalEarnedWei = totalWeiValueInRuby
              const accruedWeiPerShare = globalEarnedWei.mul(PRECISION_SCALE)
              await expect(tx)
                .to.emit(ruby, 'AccruedRoyalties')
                .withArgs(globalEarnedWei, accruedWeiPerShare, globalEarnedWei)
            })

            it('correctly updates lastCheckpoint', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await ruby.accrueRoyalties()

              const { lastWeiCheckpoint } = await ruby.getCurrentFeeGlobals()
              expect(lastWeiCheckpoint).to.be.equal(totalWeiValueInRuby)
            })
          })

          describe('with a single minter and multiple tokens', () => {
            it('gives the whole ruby share to the first minter', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await sendOneEthToSplitter()
              await ruby.accrueRoyalties()

              const royalties = await ruby.connect(alice).callStatic.withdrawRoyalties()
              expect(royalties).to.be.equal(totalWeiValueInRuby)
            })

            it('emits an AccruedRoyalties event with the expected params', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              let accruedWeiPerShare = totalWeiValueInRuby.mul(SCALE)
              expect((await ruby.getCurrentFeeGlobals()).accruedWeiPerShare)
              await sendOneEthToSplitter()
              const tx = await ruby.accrueRoyalties()
              accruedWeiPerShare = accruedWeiPerShare.add(
                ONE_ETH.mul(rubySplitterShares).div(totalSplitterShares).mul(SCALE).div(2)
              )

              await expect(tx)
                .to.emit(ruby, 'AccruedRoyalties')
                .withArgs(totalWeiValueInRuby, accruedWeiPerShare, totalWeiValueInRuby)
            })

            it('correctly updates lastCheckpoint', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await sendOneEthToSplitter()
              await ruby.accrueRoyalties()

              const { lastWeiCheckpoint } = await ruby.getCurrentFeeGlobals()
              expect(lastWeiCheckpoint).to.be.equal(totalWeiValueInRuby)
            })
          })

          // describe('bug?', () => {
          //   it('gives first share to the first minter, then gives normal rate to the rest', async () => {
          //     await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
          //     await minter.connect(bob).mint(ruby.address, alice.address, await ruby.totalSupply())
          //     await minter.connect(carol).mint(ruby.address, alice.address, await ruby.totalSupply())
          //     await ruby.accrueRoyalties()

          //     {
          //       let accruedWeiPerShare = totalWeiValueInRuby.mul(SCALE)

          //       const aliceRoyalties = await ruby.connect(alice).callStatic.withdrawRoyalties()
          //       expect(aliceRoyalties).to.be.equal(totalWeiValueInRuby)

          //       // const bobRoyalties = await ruby.connect(bob).callStatic.withdrawRoyalties()
          //       // expect(bobRoyalties).to.be.equal(0)

          //       // const carolRoyalties = await ruby.connect(bob).callStatic.withdrawRoyalties()
          //       // expect(carolRoyalties).to.be.equal(0)
          //     }
          //   })

          //   it('emits an AccruedRoyalties evnt with the expected params')
          //   it('correctly updates lastCheckpoint')
          // })

          describe('with multiple minters and multiple tokens', () => {
            it('gives first share to the first minter, then gives normal rate to the rest', async () => {
              await minter.connect(alice).mint(ruby.address, alice.address, await ruby.totalSupply())
              await minter.connect(bob).mint(ruby.address, bob.address, await ruby.totalSupply())
              await minter.connect(carol).mint(ruby.address, carol.address, await ruby.totalSupply())
              await ruby.accrueRoyalties()

              {
                let accruedWeiPerShare = totalWeiValueInRuby.mul(SCALE)

                const aliceRoyalties = await ruby.connect(alice).callStatic.withdrawRoyalties()
                expect(aliceRoyalties).to.be.equal(totalWeiValueInRuby)

                // const bobRoyalties = await ruby.connect(bob).callStatic.withdrawRoyalties()
                // expect(bobRoyalties).to.be.equal(0)

                // const carolRoyalties = await ruby.connect(bob).callStatic.withdrawRoyalties()
                // expect(carolRoyalties).to.be.equal(0)
              }
            })

            it('emits an AccruedRoyalties evnt with the expected params')
            it('correctly updates lastCheckpoint')
          })
        })

        describe('to the ruby', () => {})
      })
      describe('when no ETH has been previously forwarded', () => {})
    })
  })
  describe('withdrawRoyalties', () => {})
})
