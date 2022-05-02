import { AddressZero } from '@ethersproject/constants'
import { namehash, solidityKeccak256 } from 'ethers/lib/utils'
import { task } from 'hardhat/config'
import { ENS_ADDRESS, NFT_CONTRACT_NAME, OPEN_MINTER_CONTRACT_NAME, ENS_PROJECT_PREFIX } from '../deploy/constants'
import { ENS__factory, TestRegistrar__factory } from '../typechain-types'

task('reserveENS', 'Reserves ENS .test domains').setAction(async (args, hre) => {
  const { getNamedAccounts } = hre

  const deployer = await getNamedAccounts().then(({ deployer }) => hre.ethers.getSigner(deployer))

  const ens = ENS__factory.connect(ENS_ADDRESS, deployer)
  const testRegistrarAddress = await ens.owner(namehash('test'))

  const testRegistrar = TestRegistrar__factory.connect(testRegistrarAddress, deployer)

  const isOwned = async (domain: string) => {
    return (await ens.owner(namehash(domain))) != AddressZero
  }

  const CONTRACTS = [NFT_CONTRACT_NAME, OPEN_MINTER_CONTRACT_NAME]

  for (const contractName of CONTRACTS) {
    const label = `${ENS_PROJECT_PREFIX}-${contractName}`.toLowerCase()
    const domain = `${label}.test`

    if (await isOwned(domain)) {
      console.log(domain, 'already owned')
      continue
    }
    await testRegistrar
      .connect(deployer)
      .register(solidityKeccak256(['string'], [label]), deployer.address)
      .then(({ wait }) => wait())
    console.log('claimed ownership over domain', domain)
  }
})
