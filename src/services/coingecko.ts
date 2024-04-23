import flatCache from 'flat-cache';
import path from 'path';
import axios from 'axios';
import { Transaction } from '../utils/financialCalculations';

const cache = flatCache.load('coingeckoCache', path.resolve('./'));

const BASE_URL = 'https://api.coingecko.com/api/v3/';

interface CoinPricesResponse {
  [coinId: string]: {
    [currency: string]: number;
  };
}

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

interface ErrorResponse {
  status: 'error';
  message: string;
}

interface CoinIdsMap {
  [key: string]: string;
}

interface HistoricalData {
  [key: string]: any; // Replace 'any' with the actual type of the historical data
}


// Function to fetch prices by coin IDs
export async function getCoinPricesByIds(coinIds: string, currencies: string, options: Record<string, string> = {}): Promise<CoinPricesResponse | ErrorResponse> {
  const url = new URL(`${BASE_URL}simple/price`);
  url.searchParams.append('ids', coinIds);
  url.searchParams.append('vs_currencies', currencies);

  // Append additional options dynamically
  Object.entries(options).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await axios.get<CoinPricesResponse>(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.COIN_GECKO_API_KEY}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from CoinGecko: ${error}`);
    return { status: 'error', message: 'Failed to fetch data' };
  }
}

// Function to get a list of all coin IDs

export async function getCoinIds(): Promise<{ [key: string]: string }> {

  const url = new URL(`${BASE_URL}coins/list`);

  try {
    const response = await axios.get<Coin[]>(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.COIN_GECKO_API_KEY}`
      }
    });
    const coinIds = response.data;
    const coinIdsMap = coinIds.reduce((acc: CoinIdsMap, coin) => {
      acc[coin.symbol.toLowerCase()] = coin.id;
      return acc;
    }, {});
    return coinIdsMap;

  } catch (error) {
    console.error(`Error fetching data from CoinGecko: ${error}`);
    return { status: 'error', message: 'Failed to fetch data' };
  }
}

// Function to get historical data for a coin
export async function getHistoricalData(coinId: string): Promise<any> {
  const cacheKey = `${coinId}HistoricalData`;
  let data = cache.getKey(cacheKey);

  if (data) {
    console.log('Using cached data');
    return data;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1);

  const to = Math.floor(endDate.getTime() / 1000);
  const from = Math.floor(startDate.getTime() / 1000);

  const url = new URL(`${BASE_URL}coins/${encodeURIComponent(coinId)}/market_chart/range`);
  url.searchParams.append('vs_currency', 'usd');
  url.searchParams.append('from', from.toString());
  url.searchParams.append('to', to.toString());

  try {
    const response = await axios.get(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.COIN_GECKO_API_KEY}`
      }
    });

    // return only the prices
    data = response.data.prices;
    cache.setKey(cacheKey, data);
    cache.save();

    console.log('Fetched new data from CoinGecko');
    return response.data.prices;
  } catch (error) {
    console.error(`Error fetching historical data from CoinGecko: ${error}`);
    return { status: 'error', message: 'Failed to fetch data' };
  }
}

// Function to fetch historical data for tokens
async function fetchHistoricalDataForTokens(transactionDataTokens: Transaction[], coinIds: { [key: string]: string }): Promise<{ [symbol: string]: any }> {
  let historicalData: HistoricalData = {};
  for (const tx of transactionDataTokens) {
    const symbol = (tx.tokenSymbol || "").toString();
    if (!historicalData[symbol]) {
      try {
        historicalData[symbol] = await getHistoricalData(coinIds[symbol]);
      } catch (error) {
        console.error(`Failed to fetch historical data for ${symbol}: ${error}`);
        historicalData[symbol] = null; // Or some default/fallback value
      }
    }
  }
  // add historical data for Ethereum
  historicalData['ethereum'] = await getHistoricalData('ethereum');
  return historicalData;
}

export { fetchHistoricalDataForTokens };
