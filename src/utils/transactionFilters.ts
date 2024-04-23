interface Transaction {
    timeStamp: number;
    tokenSymbol?: string;
    from: string;        // Address of the sender
    to: string;          // Address of the receiver
    value: string;       // The value transferred in the transaction
    tokenDecimal: string; // The number of decimals of the token
  }
    
  /**
   * Filters Ethereum and token transactions based on a provided date.
   * 
   * @param ethTransactions Array of Ethereum transactions
   * @param tokenTransactions Array of token transactions
   * @param threshold Date to filter transactions by
   * @returns Filtered transaction data for Ethereum and tokens
   */
  function filterTransactions(
    ethTransactions: Transaction[],
    tokenTransactions: Transaction[],
    threshold: Date
  ): { transactionDataEth: Transaction[], transactionDataTokens: Transaction[] } {
    const transactionDataEth = ethTransactions.filter(tx => new Date(tx.timeStamp * 1000) > threshold);
    const transactionDataTokens = tokenTransactions.length
      ? tokenTransactions.filter(tx => new Date(tx.timeStamp * 1000) > threshold)
      : [];
  
    return { transactionDataEth, transactionDataTokens };
  }
  
  export { filterTransactions };
  