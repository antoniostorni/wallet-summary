import { filterTransactions } from '../utils/transactionFilters';

describe('filterTransactions', () => {
  it('should filter out transactions older than the given threshold', () => {
    const ethTransactions = [
      {
        timeStamp: new Date().getTime() / 1000 - 100000,
        from: '0x123',
        to: '0x456',
        value: '100',
        tokenDecimal: '18'
      }, // old transaction
      {
        timeStamp: new Date().getTime() / 1000 + 100,
        from: '0x789',
        to: '0xabc',
        value: '200',
        tokenDecimal: '18'
      }    // future transaction
    ];

    const tokenTransactions = [
      {
        timeStamp: new Date().getTime() / 1000 - 50000, tokenSymbol: 'USDT',
        from: '0x123',
        to: '0x456',
        value: '100',
        tokenDecimal: '18'
      }, // old transaction
      {
        timeStamp: new Date().getTime() / 1000 + 50, tokenSymbol: 'DAI',
        from: '0x789',
        to: '0xabc',
        value: '200',
        tokenDecimal: '18'
      }    // recent transaction


    ];
    const threshold = new Date();

    const result = filterTransactions(ethTransactions, tokenTransactions, threshold);

    expect(result.transactionDataEth).toHaveLength(1);
    expect(result.transactionDataEth[0].timeStamp).toBeGreaterThan(threshold.getTime() / 1000);
    expect(result.transactionDataTokens).toHaveLength(1);
    expect(result.transactionDataTokens[0].tokenSymbol).toBe('DAI');
  });
});

