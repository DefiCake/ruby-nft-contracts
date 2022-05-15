import { BigNumber } from '@ethersproject/bignumber'
import { expect } from 'chai'
import { RaffleFixture } from './fixtures/RaffleFixture'

const MAX_UINT_96 = BigNumber.from(2).pow(96).sub(1)

const MAX_WORDS = 500
describe('SimpleRafle', () => {
  describe('request', () => {
    it('rejects if called by non-owner', async () => {
      const { raffle, alice } = await RaffleFixture()
      await expect(raffle.connect(alice).request(MAX_WORDS)).to.be.revertedWith('NOT_OWNER')
    })

    it('allows to celebrate a raffle', async () => {
      const { raffle, coordinator } = await RaffleFixture()
      await coordinator.fundSubscription(await raffle.subId(), MAX_UINT_96)

      const tx = await raffle.request(MAX_WORDS).then((tx) => tx.wait())
      const [
        {
          args: { requestId },
        },
      ] = await coordinator.queryFilter(
        coordinator.filters.RandomWordsRequested(null, null, null, null, null, null, null, raffle.address),
        tx.blockNumber,
        tx.blockNumber
      )!

      const tx2 = await coordinator.fulfillRandomWords(requestId, raffle.address).then((tx) => tx.wait())

      const logs = await raffle.queryFilter(raffle.filters.NumbersReceived(), tx2.blockNumber, tx2.blockNumber)
      expect(logs).to.have.length(1)
      expect(logs[0].args.numbers).to.have.length(500)
    })
  })
})
