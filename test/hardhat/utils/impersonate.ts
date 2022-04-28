import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseEther } from 'ethers/lib/utils'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BOOMER_CONTRACT_NAME } from '../../../deploy/constants'
import { Boomer } from '../../../typechain-types'

export async function impersonate(
  hre: HardhatRuntimeEnvironment,
  address: string,
  funder?: string | SignerWithAddress
) {
  if (!funder) funder = (await hre.ethers.getSigners())[0]
  if (typeof funder === 'string') funder = await hre.ethers.getSigner(funder)

  const boomer = (await hre.ethers.getContract(BOOMER_CONTRACT_NAME)) as Boomer

  boomer.connect(funder).boom(address, { value: parseEther('0.01') })

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  })

  return await hre.ethers.getSigner(address)
}
