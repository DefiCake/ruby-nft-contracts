import { BigNumber } from '@ethersproject/bignumber'
import { expect } from 'chai'
import { RaffleFixture } from './fixtures/RaffleFixture'

const MAX_UINT_96 = BigNumber.from(2).pow(96).sub(1)

const MAX_WORDS = 500
describe('SimpleRafle', () => {
  describe('request', () => {
    it('rejects if called by non-owner', async () => {
      const { raffle, deployer, alice } = await RaffleFixture()
      await expect(raffle.connect(alice).request(MAX_WORDS)).to.be.revertedWith('NOT_OWNER')
    })

    it('allows to celebrate a raffle', async () => {
      const { raffle, deployer, alice, coordinator } = await RaffleFixture()
      const subId = await raffle.subId()
      await coordinator.fundSubscription(subId, MAX_UINT_96)

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
      const [log] = logs
      expect(logs).to.have.length(1)

      expect(log.args.numbers).to.have.length(500)
    })
  })
})
