import { FeePoolFacet__factory } from '../typechain-types'
import { ERC721Fixture } from './fixtures/ERC721Fixture'

describe('FeePoolFacet', () => {
  it('works', async () => {
    const { ruby } = await ERC721Fixture()
    const a = FeePoolFacet__factory.connect(ruby.address, ruby.provider)
  })
})
