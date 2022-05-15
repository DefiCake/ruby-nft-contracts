// Tests based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/742e85be7c08dff21410ba4aa9c60f6a033befb8/test/token/ERC721/ERC721.behavior.js

import chai from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { IRuby } from '../../typechain-types'
import { ERC721Fixture } from './fixtures/ERC721Fixture'
import { BigNumber, ContractTransaction, Wallet } from 'ethers'
import { AddressZero } from '@ethersproject/constants'
import { waffle } from 'hardhat'
import { ERC721ReceiverMock } from '../../typechain-types/ERC721ReceiverMock'
import { ERC721ReceiverMock__factory } from '../../typechain-types/factories/ERC721ReceiverMock__factory'
import { assertTransactionFailed } from './utils/assertTransactionFailed'

const { expect } = chai

const Error: any = ['None', 'RevertWithMessage', 'RevertWithoutMessage', 'Panic'].reduce(
  (acc, entry, idx) => Object.assign({ [entry]: idx }, acc),
  {}
)

const firstTokenId = BigNumber.from('5042')
const secondTokenId = BigNumber.from('79217')
const nonExistentTokenId = BigNumber.from('13')
const fourthTokenId = BigNumber.from(4)

const RECEIVER_MAGIC_VALUE = '0x150b7a02'
const INVALID_RECEIVER_VALUE = '0x00000042'

interface Addressable {
  address: string
}

describe('ERC721', () => {
  let ruby: IRuby

  const [deployer, owner, other, approved, operator, anotherApproved] = waffle.provider.getWallets()

  beforeEach(async () => {
    const fixture = await ERC721Fixture()

    ;({ ruby } = fixture)
  })

  it('name', async () => {
    await ruby.name()
  })

  it('symbol', async () => {
    await ruby.symbol()
  })

  it('supportsInterface', async function () {
    const interfaces = [
      '0x01ffc9a7', // ERC165 Interface ID for ERC165
      '0x80ac58cd', // ERC165 Interface ID for ERC721
      '0x5b5e139f', // ERC165 Interface ID for ERC721Metadata
    ]

    for (const iface of interfaces) {
      expect(await ruby.supportsInterface(iface)).to.be.equal(true)
    }

    expect(await ruby.supportsInterface('0x00000000')).to.be.equal(false)
  })

  describe('without minted tokens', () => {
    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        expect(await ruby.totalSupply()).to.be.equal('0')
      })
    })
  })

  describe('with minted tokens', async () => {
    beforeEach('mint tokens', async () => {
      await ruby.connect(deployer).mint(owner.address, firstTokenId)
      await ruby.connect(deployer).mint(owner.address, secondTokenId)
    })

    describe('balanceOf', function () {
      context('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          expect(await ruby.balanceOf(owner.address)).to.be.equal('2')
        })
      })

      context('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          expect(await ruby.balanceOf(other.address)).to.be.equal('0')
        })
      })

      context('when querying address zero', function () {
        it('reverts', async function () {
          await expect(ruby.balanceOf(AddressZero)).to.be.revertedWith('ZERO_ADDRESS')
        })
      })
    })

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        expect(await ruby.totalSupply()).to.be.equal('2')
      })
    })

    describe('tokenURI', async function () {
      it('returns tokenURIs', async () => {
        expect(await ruby.tokenURI(firstTokenId)).to.contain(firstTokenId.toString())
        expect(await ruby.tokenURI(secondTokenId)).to.contain(secondTokenId.toString())
      })

      it('reverts for non existent token IDs', async () => {
        await expect(ruby.tokenURI(nonExistentTokenId)).to.be.revertedWith('NOT_MINTED')
      })
    })

    describe('ownerOf', function () {
      context('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId

        it('returns the owner of the given token ID', async function () {
          expect(await ruby.ownerOf(tokenId)).to.be.equal(owner.address)
        })
      })

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = nonExistentTokenId

        it('reverts', async function () {
          await expect(ruby.ownerOf(tokenId)).to.be.revertedWith('NOT_MINTED')
        })
      })
    })

    describe('transfers', function () {
      const tokenId = firstTokenId
      const data = '0x42'

      let tx: ContractTransaction

      beforeEach(async function () {
        await ruby.connect(owner).approve(approved.address, tokenId)
        await ruby.connect(owner).setApprovalForAll(operator.address, true)
      })

      interface transferWasSuccessfulParams {
        owner: string
        tokenId: BigNumber
        toWhom: string
      }

      const transferWasSuccessful = function ({ owner, tokenId, toWhom }: transferWasSuccessfulParams) {
        it('transfers the ownership of the given token ID to the given address', async function () {
          expect(await ruby.ownerOf(tokenId)).to.be.equal(toWhom)
        })

        it('emits a Transfer event', async function () {
          await expect(tx).to.emit(ruby, 'Transfer').withArgs(owner, toWhom, tokenId)
          // expectEvent.inLogs(logs, 'Transfer', { from: owner, to: this.toWhom, tokenId: tokenId })
        })

        it('clears the approval for the token ID', async function () {
          expect(await ruby.getApproved(tokenId)).to.be.equal(AddressZero)
        })

        it('adjusts owners balances', async function () {
          expect(await ruby.balanceOf(owner)).to.be.equal('1')
        })
      }

      const shouldTransferTokensByUsers = function (
        transferFunction: (
          from: Addressable | string,
          to: Addressable | string,
          tokenId: BigNumber,
          sender: SignerWithAddress | Wallet
        ) => Promise<ContractTransaction>
      ) {
        context('when called by the owner', function () {
          const toWhom = other

          beforeEach(async function () {
            tx = await transferFunction(owner, other, tokenId, owner)
          })

          transferWasSuccessful({ owner: owner.address, tokenId, toWhom: toWhom.address })
        })

        context('when called by the approved individual', function () {
          const toWhom = other

          beforeEach(async function () {
            tx = await transferFunction(owner, toWhom, tokenId, approved)
          })
          transferWasSuccessful({ owner: owner.address, tokenId, toWhom: toWhom.address })
        })

        context('when called by the operator.address', function () {
          const toWhom = other

          beforeEach(async function () {
            tx = await transferFunction(owner, toWhom, tokenId, operator)
          })
          transferWasSuccessful({ owner: owner.address, tokenId, toWhom: toWhom.address })
        })

        context('when called by the owner without an approved user', function () {
          const toWhom = other

          beforeEach(async function () {
            await ruby.connect(owner).approve(AddressZero, tokenId)
            tx = await transferFunction(owner, toWhom, tokenId, operator)
          })
          transferWasSuccessful({ owner: owner.address, tokenId, toWhom: toWhom.address })
        })

        context('when sent to the owner', function () {
          beforeEach(async function () {
            tx = await transferFunction(owner, owner, tokenId, owner)
          })

          it('keeps ownership of the token', async function () {
            expect(await ruby.ownerOf(tokenId)).to.be.equal(owner.address)
          })

          it('clears the approval for the token ID', async function () {
            expect(await ruby.getApproved(tokenId)).to.be.equal(AddressZero)
          })

          it('emits only a transfer event', async function () {
            await expect(tx).to.emit(ruby, 'Transfer').withArgs(owner.address, owner.address, tokenId)
          })

          it('keeps the owner balance', async function () {
            expect(await ruby.balanceOf(owner.address)).to.be.equal('2')
          })

          // it('keeps same tokens by index', async function () {
          //   if (!ruby.tokenOfOwnerByIndex) return
          //   const tokensListed = await Promise.all([0, 1].map((i) => ruby.tokenOfOwnerByIndex(owner, i)))
          //   expect(tokensListed.map((t) => t.toNumber())).to.have.members([
          //     firstTokenId.toNumber(),
          //     secondTokenId.toNumber(),
          //   ])
          // })
        })

        context('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await expect(transferFunction(other, other, tokenId, other)).to.be.revertedWith('WRONG_FROM')
          })
        })

        context('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            await expect(transferFunction(owner, other, tokenId, other)).to.be.revertedWith('NOT_AUTHORIZED')
          })
        })

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await expect(transferFunction(owner, other, nonExistentTokenId, owner)).to.be.revertedWith('WRONG_FROM')
          })
        })

        context('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await expect(transferFunction(owner, AddressZero, tokenId, owner)).to.be.revertedWith('INVALID_RECIPIENT')
          })
        })
      }

      describe('via transferFrom', function () {
        shouldTransferTokensByUsers(
          (
            from: Addressable | string,
            to: Addressable | string,
            tokenId: BigNumber,
            sender: SignerWithAddress | Wallet
          ) => {
            if (typeof from === 'object') from = from.address
            if (typeof to === 'object') to = to.address

            return ruby.connect(sender).transferFrom(from, to, tokenId)
          }
        )
      })

      describe('via safeTransferFrom', function () {
        let receiver: ERC721ReceiverMock

        const safeTransferFromWithData = function (
          from: Addressable | string,
          to: Addressable | string,
          tokenId: BigNumber,
          sender: SignerWithAddress | Wallet
        ) {
          if (typeof from === 'object') from = from.address
          if (typeof to === 'object') to = to.address

          return ruby.connect(sender)['safeTransferFrom(address,address,uint256,bytes)'](from, to, tokenId, data)
        }

        const safeTransferFromWithoutData = function (
          from: Addressable | string,
          to: Addressable | string,
          tokenId: BigNumber,
          sender: SignerWithAddress | Wallet
        ) {
          if (typeof from === 'object') from = from.address
          if (typeof to === 'object') to = to.address
          return ruby.connect(sender)['safeTransferFrom(address,address,uint256)'](from, to, tokenId)
        }

        const shouldTransferSafely = function (
          transferFun: (
            from: Addressable | string,
            to: Addressable | string,
            tokenId: BigNumber,
            sender: SignerWithAddress | Wallet
          ) => Promise<ContractTransaction>,
          data: string = '0x'
        ) {
          describe('to a user account', function () {
            shouldTransferTokensByUsers(transferFun)
          })

          describe('to a valid receiver contract', function () {
            beforeEach(async function () {
              receiver = await new ERC721ReceiverMock__factory(deployer).deploy(RECEIVER_MAGIC_VALUE, Error.None)
            })

            shouldTransferTokensByUsers(transferFun)

            it('calls onERC721Received', async function () {
              const tx = await transferFun(owner, receiver, tokenId, owner)

              await expect(tx).to.emit(receiver, 'Received').withArgs(owner.address, owner.address, tokenId, data)
            })

            it('calls onERC721Received from approved', async function () {
              const tx = await transferFun(owner, receiver, tokenId, approved)

              await expect(tx).to.emit(receiver, 'Received').withArgs(approved.address, owner.address, tokenId, data)
            })

            describe('with an invalid token id', function () {
              it('reverts', async function () {
                const tx = transferFun(owner, receiver, nonExistentTokenId, owner)

                await expect(tx).to.be.revertedWith('WRONG_FROM')
              })
            })
          })
        }

        describe('with data', function () {
          shouldTransferSafely(safeTransferFromWithData, data)
        })

        describe('without data', function () {
          shouldTransferSafely(safeTransferFromWithoutData)
        })

        describe('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(INVALID_RECEIVER_VALUE, Error.None)
            const tx = ruby
              .connect(owner)
              ['safeTransferFrom(address,address,uint256)'](owner.address, receiver.address, tokenId)
            await expect(tx).to.be.revertedWith('UNSAFE_RECIPIENT')
          })
        })

        describe('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(
              RECEIVER_MAGIC_VALUE,
              Error.RevertWithMessage
            )

            const tx = ruby
              .connect(owner)
              ['safeTransferFrom(address,address,uint256)'](owner.address, receiver.address, tokenId)
            await expect(tx).to.be.revertedWith('ERC721ReceiverMock: reverting')
          })
        })

        describe('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(
              RECEIVER_MAGIC_VALUE,
              Error.RevertWithoutMessage
            )

            const tx = ruby
              .connect(owner)
              ['safeTransferFrom(address,address,uint256)'](owner.address, receiver.address, tokenId)

            await expect(tx).to.be.reverted
          })
        })

        describe('to a receiver contract that panics', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(RECEIVER_MAGIC_VALUE, Error.Panic)

            const tx = ruby
              .connect(owner)
              ['safeTransferFrom(address,address,uint256)'](owner.address, receiver.address, tokenId)

            await expect(tx).to.be.reverted
          })
        })

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const receiver = ruby

            const tx = ruby
              .connect(owner)
              ['safeTransferFrom(address,address,uint256)'](owner.address, receiver.address, tokenId)

            await expect(tx).to.be.reverted
          })
        })
      })
    })

    describe('safe mint', function () {
      let receiver: ERC721ReceiverMock
      let tx: ContractTransaction | Promise<ContractTransaction>

      const tokenId = fourthTokenId
      const data = '0x42'

      describe('via safeMint', function () {
        // regular minting is tested in ERC721Mintable.test.js and others
        it('calls onERC721Received — with data', async function () {
          receiver = await new ERC721ReceiverMock__factory(deployer).deploy(RECEIVER_MAGIC_VALUE, Error.None)
          tx = await ruby['safeMint(address,uint256,bytes)'](receiver.address, tokenId, data)
          await expect(tx).to.emit(receiver, 'Received').withArgs(deployer.address, AddressZero, tokenId, data)
        })

        it('calls onERC721Received — without data', async function () {
          receiver = await new ERC721ReceiverMock__factory(deployer).deploy(RECEIVER_MAGIC_VALUE, Error.None)
          tx = await ruby['safeMint(address,uint256)'](receiver.address, tokenId)
          await expect(tx).to.emit(receiver, 'Received').withArgs(deployer.address, AddressZero, tokenId, '0x')
        })

        context('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(INVALID_RECEIVER_VALUE, Error.None)
            tx = ruby['safeMint(address,uint256)'](receiver.address, tokenId)
            await expect(tx).to.be.revertedWith('UNSAFE_RECIPIENT')
          })
        })

        context('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(
              RECEIVER_MAGIC_VALUE,
              Error.RevertWithMessage
            )
            tx = ruby['safeMint(address,uint256)'](receiver.address, tokenId)
            await expect(tx).to.be.revertedWith('ERC721ReceiverMock: reverting')
          })
        })

        context('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(
              RECEIVER_MAGIC_VALUE,
              Error.RevertWithoutMessage
            )
            tx = ruby['safeMint(address,uint256)'](receiver.address, tokenId)
            await expect(tx).to.be.reverted
          })
        })

        context('to a receiver contract that panics', function () {
          it('reverts', async function () {
            receiver = await new ERC721ReceiverMock__factory(deployer).deploy(RECEIVER_MAGIC_VALUE, Error.Panic)
            tx = ruby['safeMint(address,uint256)'](receiver.address, tokenId)
            await expect(tx).to.be.reverted
          })
        })

        context('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            tx = ruby['safeMint(address,uint256)'](ruby.address, tokenId)
            await expect(tx).to.be.reverted
          })
        })
      })

      describe('approve', function () {
        const tokenId = firstTokenId

        let logs = null
        let tx: ContractTransaction | Promise<ContractTransaction>

        const itClearsApproval = function () {
          it('clears approval for the token', async function () {
            expect(await ruby.getApproved(tokenId)).to.be.equal(AddressZero)
          })
        }

        const itApproves = function (address: string) {
          it('sets the approval for the target address', async function () {
            expect(await ruby.getApproved(tokenId)).to.be.equal(address)
          })
        }

        const itEmitsApprovalEvent = function (address: string) {
          it('emits an approval event', async function () {
            await expect(tx).to.emit(ruby, 'Approval').withArgs(owner.address, address, tokenId)
          })
        }

        context('when clearing approval', function () {
          context('when there was no prior approval', function () {
            beforeEach(async function () {
              tx = await ruby.connect(owner).approve(AddressZero, tokenId)
            })

            itClearsApproval()
            itEmitsApprovalEvent(AddressZero)
          })

          context('when there was a prior approval', function () {
            beforeEach(async function () {
              await ruby.connect(owner).approve(approved.address, tokenId)
              tx = await ruby.connect(owner).approve(AddressZero, tokenId)
            })

            itClearsApproval()
            itEmitsApprovalEvent(AddressZero)
          })
        })

        context('when approving a non-zero address', function () {
          context('when there was no prior approval', function () {
            beforeEach(async function () {
              tx = await ruby.connect(owner).approve(approved.address, tokenId)
            })

            itApproves(approved.address)
            itEmitsApprovalEvent(approved.address)
          })

          context('when there was a prior approval to the same address', function () {
            beforeEach(async function () {
              await ruby.connect(owner).approve(approved.address, tokenId)
              tx = await ruby.connect(owner).approve(approved.address, tokenId)
            })

            itApproves(approved.address)
            itEmitsApprovalEvent(approved.address)
          })

          context('when there was a prior approval to a different address', function () {
            beforeEach(async function () {
              await ruby.connect(owner).approve(anotherApproved.address, tokenId)
              tx = await ruby.connect(owner).approve(anotherApproved.address, tokenId)
            })

            itApproves(anotherApproved.address)
            itEmitsApprovalEvent(anotherApproved.address)
          })
        })

        context('when the sender does not own the given token ID', function () {
          it('reverts', async function () {
            tx = ruby.connect(other).approve(approved.address, tokenId)
            await assertTransactionFailed(tx)
            await expect(tx).to.be.revertedWith('NOT_AUTHORIZED')
          })
        })

        context('when the sender is approved for the given token ID', function () {
          it('reverts', async function () {
            await ruby.connect(owner).approve(approved.address, tokenId)
            tx = ruby.connect(anotherApproved).approve(anotherApproved.address, tokenId)
            await assertTransactionFailed(tx)
            await expect(tx).to.be.revertedWith('NOT_AUTHORIZED')
          })
        })

        context('when the sender is an operator', function () {
          beforeEach(async function () {
            await ruby.connect(owner).setApprovalForAll(operator.address, true)
            tx = await ruby.connect(operator).approve(approved.address, tokenId)
          })

          itApproves(approved.address)
          itEmitsApprovalEvent(approved.address)
        })

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            tx = ruby.connect(operator).approve(approved.address, nonExistentTokenId)
            await assertTransactionFailed(tx)
            await expect(tx).to.be.revertedWith('NOT_AUTHORIZED')
          })
        })
      })

      describe('setApprovalForAll', function () {
        context('when the operator.address willing to approve is not the owner', function () {
          context('when there is no operator approval set by the sender', function () {
            it('approves the operator.address', async function () {
              await ruby.connect(owner).setApprovalForAll(operator.address, true)

              expect(await ruby.isApprovedForAll(owner.address, operator.address)).to.equal(true)
            })

            it('emits an approval event', async function () {
              const tx = await ruby.connect(owner).setApprovalForAll(operator.address, true)
              await expect(tx).to.emit(ruby, 'ApprovalForAll').withArgs(owner.address, operator.address, true)
            })
          })

          context('when the operator was set as not approved', function () {
            beforeEach(async function () {
              await ruby.connect(owner).setApprovalForAll(operator.address, false)
            })

            it('approves the operator.address', async function () {
              await ruby.connect(owner).setApprovalForAll(operator.address, true)
              expect(await ruby.isApprovedForAll(owner.address, operator.address)).to.equal(true)
            })

            it('emits an approval event', async function () {
              const tx = await ruby.connect(owner).setApprovalForAll(operator.address, true)
              await expect(tx).to.emit(ruby, 'ApprovalForAll').withArgs(owner.address, operator.address, true)
            })

            it('can unset the operator approval', async function () {
              await ruby.connect(owner).setApprovalForAll(operator.address, false)
              expect(await ruby.isApprovedForAll(owner.address, operator.address)).to.equal(false)
            })
          })

          context('when the operator was already approved', function () {
            beforeEach(async function () {
              await ruby.connect(owner).setApprovalForAll(operator.address, true)
            })

            it('keeps the approval to the given address', async function () {
              await ruby.connect(owner).setApprovalForAll(operator.address, true)
              expect(await ruby.isApprovedForAll(owner.address, operator.address)).to.equal(true)
            })

            it('emits an approval event', async function () {
              const tx = await ruby.connect(owner).setApprovalForAll(operator.address, true)
              expect(tx).to.emit(ruby, 'ApprovalForAll').withArgs(owner.address, operator.address, true)
            })
          })
        })
      })

      describe('getApproved', async function () {
        context('when token is not minted', async function () {
          it('returns zero address', async function () {
            expect(await ruby.getApproved(nonExistentTokenId)).to.be.equal(AddressZero)
          })
        })

        context('when token has been minted ', async function () {
          it('should return the zero address', async function () {
            expect(await ruby.getApproved(firstTokenId)).to.be.equal(AddressZero)
          })

          context('when account has been approved', async function () {
            beforeEach(async function () {
              await ruby.connect(owner).approve(approved.address, firstTokenId)
            })

            it('returns approved account', async function () {
              expect(await ruby.getApproved(firstTokenId)).to.be.equal(approved.address)
            })
          })
        })
      })
    })
  })

  describe('mint(address, uint256)', function () {
    it('reverts with a null destination address', async function () {
      const tx = ruby.connect(deployer).mint(AddressZero, firstTokenId)
      await assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith('INVALID_RECIPIENT')
    })

    it('reverts if called by non minter', async function () {
      const tx = ruby.connect(owner).mint(AddressZero, firstTokenId)
      await assertTransactionFailed(tx)
      await expect(tx).to.be.revertedWith('NOT_MINTER')
    })

    context('with minted token', async function () {
      let tx: ContractTransaction

      beforeEach(async function () {
        tx = await ruby.connect(deployer).mint(owner.address, firstTokenId)
      })

      it('emits a Transfer event', async function () {
        await expect(tx).to.emit(ruby, 'Transfer').withArgs(AddressZero, owner.address, firstTokenId)
      })

      it('creates the token', async function () {
        expect(await ruby.balanceOf(owner.address)).to.be.equal('1')
        expect(await ruby.ownerOf(firstTokenId)).to.equal(owner.address)
      })

      it('reverts when adding a token id that already exists', async function () {
        const tx = ruby.connect(deployer).mint(owner.address, firstTokenId)
        await assertTransactionFailed(tx)
        await expect(tx).to.revertedWith('ALREADY_MINTED')
      })
    })
  })

  /**
   * Tests not needed while _burn call is un-implemented
   */

  // describe('_burn', function () {
  //   it('reverts when burning a non-existent token id', async function () {
  //     await expectRevert(ruby.burn(nonExistentTokenId), 'ERC721: owner query for nonexistent token')
  //   })

  //   context('with minted tokens', function () {
  //     beforeEach(async function () {
  //       await ruby.mint(owner, firstTokenId)
  //       await ruby.mint(owner, secondTokenId)
  //     })

  //     context('with burnt token', function () {
  //       beforeEach(async function () {
  //         ;({ logs: this.logs } = await ruby.burn(firstTokenId))
  //       })

  //       it('emits a Transfer event', function () {
  //         expectEvent.inLogs(this.logs, 'Transfer', { from: owner, to: AddressZero, tokenId: firstTokenId })
  //       })

  //       it('emits an Approval event', function () {
  //         expectEvent.inLogs(this.logs, 'Approval', { owner, approved.address: AddressZero, tokenId: firstTokenId })
  //       })

  //       it('deletes the token', async function () {
  //         expect(await ruby.balanceOf(owner)).to.be.equal('1')
  //         await expectRevert(ruby.ownerOf(firstTokenId), 'ERC721: owner query for nonexistent token')
  //       })

  //       it('reverts when burning a token id that has been deleted', async function () {
  //         await expectRevert(ruby.burn(firstTokenId), 'ERC721: owner query for nonexistent token')
  //       })
  //     })
  //   })
  // })
})
