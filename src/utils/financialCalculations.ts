import { getCoinPricesByIds } from '@/services/coingecko';
import { findPriceBefore } from '@/utils/transactions';

export interface Transaction {
    timeStamp: number;
    tokenSymbol?: string;
    from: string;        // Address of the sender
    to: string;          // Address of the receiver
    value: string;       // The value transferred in the transaction
    tokenDecimal: string; // The number of decimals of the token
}

interface HistoricalData {
    [symbol: string]: any[]; // This should correspond to historical price data structured as needed by findPriceBefore.
}

interface TokenBalanceResult {
    totalInUsd: number;
    totalOutUsd: number;
    tokenBalances: { [symbol: string]: bigint };
    tokenDecimals: { [symbol: string]: number };
}

/**
 * Calculates the total USD value of the wallet's holdings.
 * 
 * @param tokenBalances Current token balances in the wallet
 * @param tokenDecimals Decimal places for each token
 * @param coinIds Mapping of token symbols to CoinGecko IDs
 * @param ethBalance Current Ethereum balance in wei
 * @returns Total value in USD and a map of token holdings
 */
async function calculatePortfolioValue(
    tokenBalances: { [symbol: string]: bigint },
    tokenDecimals: { [symbol: string]: number },
    coinIds: { [key: string]: string },
    ethBalance: bigint
): Promise<{ totalValueUSD: number, tokenHoldings: { [symbol: string]: string } }> {

    const tokenSymbols = 'ethereum,' + Object.keys(tokenBalances)
        .map(symbol => coinIds[symbol.toLowerCase()])
        .filter(Boolean)
        .join(',');

    const prices = await getCoinPricesByIds(tokenSymbols, 'usd');

    let totalValueUSD = 0;
    Object.entries(tokenBalances).forEach(([symbol, balanceBigInt]) => {
        const decimals = tokenDecimals[symbol];
        const divisor = 10 ** decimals;
        const balance = Number(balanceBigInt) / divisor;
        // @ts-ignore
        const tokenPrice = prices[coinIds[symbol.toLowerCase()]]?.usd || 0;
        totalValueUSD += balance * tokenPrice;
    });

    // @ts-ignore
    totalValueUSD += (Number(ethBalance) / (10 ** 18)) * (prices['ethereum']?.usd || 0);

    let tokenHoldings = Object.fromEntries(
        Object.entries(tokenBalances).map(([symbol, balanceBigInt]) => {
            const decimals = tokenDecimals[symbol];
            const divisor = 10 ** decimals;
            const balance = (Number(balanceBigInt) / divisor).toString();
            return [symbol, balance];
        })
    );
    tokenHoldings['ETH'] = (Number(ethBalance) / (10 ** 18)).toString();

    return { totalValueUSD, tokenHoldings };
}

export { calculatePortfolioValue };

/**
 * Calculate token balances and their respective USD values based on transactions.
 * 
 * @param transactionDataEth Array of Ethereum transactions
 * @param transactionDataTokens Array of token transactions
 * @param walletAddress The wallet address to compute balances for
 * @param historicalData Historical price data for each token
 * @param oneMonthAgo Date one month ago to filter recent transactions
 * @returns Token balance results including movements in USD and token balances
 */
export function calculateTokenBalances(
    transactionDataEth: Transaction[],
    transactionDataTokens: Transaction[],
    walletAddress: string,
    historicalData: HistoricalData,
    oneMonthAgo: Date
): TokenBalanceResult {
    let totalInUsd = 0;
    let totalOutUsd = 0;
    const tokenBalances: { [symbol: string]: bigint } = {};
    const tokenDecimals: { [symbol: string]: number } = {};

    // Process Ethereum transactions
    transactionDataEth.forEach(tx => {
        const price = findPriceBefore(historicalData['ethereum'], tx.timeStamp * 1000) || 0;
        const txValue = BigInt(tx.value) / BigInt(10 ** 18); // Convert from wei to ether

        if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
            totalOutUsd += Number(txValue) * price;
        } else if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
            totalInUsd += Number(txValue) * price;
        }
    });

    // Process token transactions
    transactionDataTokens.forEach(tx => {
        const symbol = tx.tokenSymbol?.toLowerCase() || "unknown"; // Handle possibly undefined tokenSymbol
        const valueBigInt = BigInt(tx.value);
        const tokenDecimal = parseInt(tx.tokenDecimal);
        const tokenTimestamp = tx.timeStamp * 1000;

        if (!tokenBalances[symbol]) {
            tokenBalances[symbol] = BigInt(0);
            tokenDecimals[symbol] = tokenDecimal;
        }

        if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
            tokenBalances[symbol] -= valueBigInt;
            if (new Date(tokenTimestamp) > oneMonthAgo) {
                let price = findPriceBefore(historicalData[symbol], tokenTimestamp) || 0;
                const valueDecimals = Number(valueBigInt) / Math.pow(10, tokenDecimal);
                totalOutUsd += valueDecimals * price;
            }
        } else if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
            tokenBalances[symbol] += valueBigInt;
            if (new Date(tokenTimestamp) > oneMonthAgo) {
                let price = findPriceBefore(historicalData[symbol], tokenTimestamp) || 0;
                const valueDecimals = Number(valueBigInt) / Math.pow(10, tokenDecimal);
                totalInUsd += valueDecimals * price;
            }
        }
    });

    return {
        totalInUsd,
        totalOutUsd,
        tokenBalances,
        tokenDecimals
    };
}
