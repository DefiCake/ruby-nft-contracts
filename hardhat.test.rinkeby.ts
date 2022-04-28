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
      deploy: ['./deploy/rinkeby'],
      forking: {
        url: process.env.RINKEBY!,
      },
      allowUnlimitedContractSize: true,
    },
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
    tests: 'test/rinkeby-integration',
  },
}

export default config
