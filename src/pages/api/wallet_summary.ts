import type { NextApiRequest, NextApiResponse } from 'next';
import { getEthBalance, getTokenTransactions, getTransactions } from '../../services/etherscan';
import { getCoinIds } from '../../services/coingecko';
import { isAddress } from 'web3-validator';
import { filterTransactions } from '../../utils/transactionFilters';
import { calculateTokenBalances, calculatePortfolioValue } from '../../utils/financialCalculations';
import { fetchHistoricalDataForTokens } from '../../services/coingecko';

interface ApiResponse {
  status: string;
  data?: any;
  error?: string;
}

const sendErrorResponse = (res: NextApiResponse<ApiResponse>, message: string) => {
  res.status(400).json({ status: 'error', error: message });
};

const sendSuccessResponse = (res: NextApiResponse<ApiResponse>, data: any) => {
  res.status(200).json(data);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {

  if (req.method !== 'POST') {
    return sendErrorResponse(res, 'Only POST method is accepted');
  }

  // Simple Authorization check (You should replace this with a more robust method like JWT or OAuth tokens)
  if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return sendErrorResponse(res, 'Unauthorized');
  }

  const { walletAddress } = req.body;

  if (!walletAddress) {
    return sendErrorResponse(res, 'Wallet address is required');
  }
  if (!isAddress(walletAddress)) {
    return sendErrorResponse(res, 'Invalid Ethereum address');
  }

  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [ethBalance, transactions, tokenTransactions, coinIds] = await Promise.all([
      getEthBalance(walletAddress),
      getTransactions(walletAddress),
      getTokenTransactions(walletAddress),
      getCoinIds(),
    ]);

    const { transactionDataEth, transactionDataTokens } = filterTransactions(transactions, tokenTransactions, oneMonthAgo);
    let historicalData = await fetchHistoricalDataForTokens(transactionDataTokens, coinIds);
    const { totalInUsd, totalOutUsd, tokenBalances, tokenDecimals } = calculateTokenBalances(transactionDataEth, transactionDataTokens, walletAddress, historicalData, oneMonthAgo);
    const { totalValueUSD, tokenHoldings } = await calculatePortfolioValue(tokenBalances, tokenDecimals, coinIds, ethBalance);

    const response = {
      totalValueUSD: totalValueUSD.toString(),
      tokenHoldings,
      summaryLastMonth: {
        totalInUsd,
        totalOutUsd
      }
    };
    sendSuccessResponse(res, response);
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`API Handler Error: ${errorMessage}`);
    sendErrorResponse(res, 'Failed to fetch data');
  }
}
