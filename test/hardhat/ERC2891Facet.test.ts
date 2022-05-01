import { parseEther } from '@ethersproject/units'
import { expect } from 'chai'
import { ERC2891_FEE_SHARE, SCALE } from '../../deploy/constants'
import { FeePoolFixture } from './fixtures/FeePoolFixture'

describe('ERC2891Facet', () => {
  it('supportsInterface', async function () {
    const { ruby } = await FeePoolFixture()

    const interfaces = [
      '0x2a55205a', // ERC165 Interface ID for ERC2891
    ]

    for (const iface of interfaces) {
      expect(await ruby.supportsInterface(iface)).to.be.equal(true)
    }
  })

  it('royaltyInfo', async () => {
    const { ruby, splitter } = await FeePoolFixture()

    const salePrice = parseEther('1')
    const [receiver, feeAmount] = await ruby.royaltyInfo(0, salePrice)

    expect(receiver).to.be.equal(splitter.address)
    expect(feeAmount).to.be.equal(salePrice.mul(ERC2891_FEE_SHARE).div(SCALE))
  })
})
