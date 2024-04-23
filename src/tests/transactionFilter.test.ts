import { filterTransactions } from '../utils/transactionFilters';

describe('filterTransactions', () => {
  it('should filter out transactions older than the given threshold', () => {
    const ethTransactions = [
      {
        timeStamp: new Date().getTime() / 1000 - 100000
      }, // old transaction
      { timeStamp: new Date().getTime() / 1000 + 100 }    // future transaction
    ];

    const tokenTransactions = [
      { timeStamp: new Date().getTime() / 1000 - 50000, tokenSymbol: 'USDT' }, // old transaction
      { timeStamp: new Date().getTime() / 1000 + 50, tokenSymbol: 'DAI' }    // recent transaction
    ];
    const threshold = new Date();

    const result = filterTransactions(ethTransactions, tokenTransactions, threshold);

    expect(result.transactionDataEth).toHaveLength(1);
    expect(result.transactionDataEth[0].timeStamp).toBeGreaterThan(threshold.getTime() / 1000);
    expect(result.transactionDataTokens).toHaveLength(1);
    expect(result.transactionDataTokens[0].tokenSymbol).toBe('DAI');
  });
});

