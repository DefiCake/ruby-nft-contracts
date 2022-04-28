import { HashZero } from '@ethersproject/constants'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { deployments, ethers } from 'hardhat'
import { AggregatorV3Interface__factory, OpenMinter__factory } from '../../typechain-types'

const WEI_SCALE = BigNumber.from(10).pow(18)

describe('minting test', () => {
  it('minting costs an amount of ETH equivalent to the set price', async () => {
    const {
      OpenMinter: { address },
    } = await deployments.fixture()
    const [alice] = await ethers.getSigners()
    const minter = OpenMinter__factory.connect(address, alice)
    const oracle = AggregatorV3Interface__factory.connect(await minter.oracle(), ethers.provider)

    const price_USDNFT = await minter.PRICE()

    const { answer: chainlinkPrice } = await oracle.latestRoundData()

    const expectedCostWei = WEI_SCALE.mul(price_USDNFT).div(chainlinkPrice)
    const value = parseEther('1')

    const tx = await minter.mint([HashZero], HashZero, { value })
    await expect(tx).to.changeEtherBalance(minter, expectedCostWei)
    await expect(tx).to.changeEtherBalance(alice, expectedCostWei.mul(-1))
  })
})
