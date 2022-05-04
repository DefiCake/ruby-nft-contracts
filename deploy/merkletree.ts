import { isAddress } from 'ethers/lib/utils'
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

export function generateMerkleTree(addresses: string[]) {
  addresses.forEach((address) => {
    if (!isAddress(address)) throw new Error(`${address} is not a valid address`)
  })

  return new MerkleTree(addresses, keccak256, { hashLeaves: true, sortPairs: true })
}
