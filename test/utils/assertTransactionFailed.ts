import { assert, expect } from 'chai'
import { ContractTransaction } from 'ethers'

export async function assertTransactionFailed(tx: Promise<ContractTransaction> | ContractTransaction) {
  const transactionShouldHaveFailedButDidNot = () => false
  const transactionFailedAsExpected = () => true

  if ('then' in tx) {
    const result = await tx
      .then((tx) => tx.wait())
      .then(transactionShouldHaveFailedButDidNot)
      .catch(transactionFailedAsExpected)

    return expect(result).to.be.equal(true, 'Transaction did not revert')
  }

  const result = await tx.wait().then(transactionShouldHaveFailedButDidNot).catch(transactionFailedAsExpected)

  return expect(result).to.be.equal(true, 'Transaction did not revert')
}
