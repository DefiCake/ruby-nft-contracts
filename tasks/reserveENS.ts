import { AddressZero } from '@ethersproject/constants'
import { namehash, solidityKeccak256 } from 'ethers/lib/utils'
import { task } from 'hardhat/config'
import { ENS_ADDRESS, NFT_CONTRACT_NAME, OPEN_MINTER_CONTRACT_NAME, ENS_PROJECT_PREFIX } from '../deploy/constants'

import { abi as ENS_ABI } from '@ensdomains/ens/build/contracts/ENS.json'
import { abi as REGISTRAR_ABI } from '@ensdomains/ens/build/contracts/TestRegistrar.json'
import { Contract, ContractTransaction } from 'ethers'

task('reserveENS', 'Reserves ENS .test domains').setAction(async (args, hre) => {
  const { getNamedAccounts } = hre

  const deployer = await getNamedAccounts().then(({ deployer }) => hre.ethers.getSigner(deployer))

  const ens = new Contract(ENS_ADDRESS, ENS_ABI, deployer)
  const testRegistrarAddress = await ens.owner(namehash('test'))

  const testRegistrar = new Contract(testRegistrarAddress, REGISTRAR_ABI, deployer)

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
      .then((tx: ContractTransaction) => tx.wait())
    console.log('claimed ownership over domain', domain)
  }
})
