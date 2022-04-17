import { FeePoolFacet__factory } from '../typechain-types'
import { ERC721Fixture } from './fixtures/ERC721Fixture'

describe.only('FeePoolFacet', () => {
  it('works', async () => {
    const { ruby } = await ERC721Fixture()
    const a = FeePoolFacet__factory.connect(ruby.address, ruby.provider)

    console.log(await a.pool())
  })
})
