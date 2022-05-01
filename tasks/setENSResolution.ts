import { AddressZero } from '@ethersproject/constants'
import { namehash } from 'ethers/lib/utils'
import { task } from 'hardhat/config'
import {
  PUBLIC_RESOLVER_CONTRACT_NAME,
  ENS_ADDRESS,
  NFT_CONTRACT_NAME,
  OPEN_MINTER_CONTRACT_NAME,
  ENS_PROJECT_PREFIX,
} from '../deploy/constants'
import { PublicResolver__factory, ENS__factory } from '../typechain-types'

task('setENSResolution', 'Updates the name => address mapping on ENS registry').setAction(async (args, hre) => {
  const {
    getNamedAccounts,
    deployments: { deploy },
  } = hre

  const deployer = await getNamedAccounts().then(({ deployer }) => hre.ethers.getSigner(deployer))
  const { address: publicResolverAddress } = await deploy(PUBLIC_RESOLVER_CONTRACT_NAME, {
    from: deployer.address,
    log: true,
    args: [ENS_ADDRESS, AddressZero],
  })

  const publicResolver = PublicResolver__factory.connect(publicResolverAddress, deployer)

  const ens = ENS__factory.connect(ENS_ADDRESS, deployer)

  const isOwned = async (domain: string) => {
    return (await ens.owner(namehash(domain))) != AddressZero
  }

  const CONTRACTS = [NFT_CONTRACT_NAME, OPEN_MINTER_CONTRACT_NAME]

  for (const contractName of CONTRACTS) {
    const label = `${ENS_PROJECT_PREFIX}-${contractName}`.toLowerCase()
    const domain = `${label}.test`

    if ((await isOwned(domain)) === false) {
      console.log(domain, 'not owned, skipping')
      continue
    }

    const { address } = await hre.ethers.getContract(contractName)
    if ((await ens.resolver(namehash(domain))) != publicResolverAddress)
      await ens.setResolver(namehash(domain), publicResolverAddress)

    await publicResolver['setAddr(bytes32,address)'](namehash(domain), address)
  }
})
