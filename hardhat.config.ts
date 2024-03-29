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
import './tasks'

import { HardhatUserConfig, NetworksUserConfig } from 'hardhat/types'

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

let networks: NetworksUserConfig = {}

if (process.env.GOERLI) {
  const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined
  networks[`goerli`] = {
    url: process.env.GOERLI,
    accounts,
  }
}

if (process.env.RINKEBY) {
  const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined
  networks[`rinkeby`] = {
    url: process.env.RINKEBY,
    accounts,
    deploy: ['./deploy/rinkeby'],
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.3',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
      /**
       * From https://github.com/0xSplits/splits-contracts/blob/0bdc1544447668e135d5ac9063cafd2d7337d748/hardhat.config.ts
       * These versions compile 0xSplits contracts, do not modify.
       */
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            // runs: 999999,
          },
        },
      },
      {
        version: '0.5.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      deploy: ['./deploy/hardhat'],
      allowUnlimitedContractSize: true,
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
  paths: {
    tests: 'test/hardhat',
  },
  mocha: {
    bail: true,
  },
}

export default config
