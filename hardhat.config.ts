import dotenv from 'dotenv'
dotenv.config()

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-etherscan'
import 'solidity-coverage'
import 'hardhat-deploy'
import 'hardhat-tracer'
import '@atixlabs/hardhat-time-n-mine'

import { HardhatUserConfig, NetworksUserConfig } from 'hardhat/types'

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

let networks: NetworksUserConfig = {}

if (process.env.GOERLI) {
  const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined
  networks['goerli'] = {
    url: process.env.GOERLI,
    accounts,
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.13',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      deploy: ['./deploy/hardhat'],
    },
    localhost: {},
    ...networks,
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: 0,
  },
}

export default config
