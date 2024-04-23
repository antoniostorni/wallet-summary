import axios from 'axios';
import { parseArgs } from 'util';
import { isAddress } from 'web3-validator';


const API_KEY = process.env.ETHERSCAN_API_KEY;
const BASE_URL = 'https://api.etherscan.io/api';

async function fetchFromEtherscan(module: string, action: string, address: string, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.append('module', module);
  url.searchParams.append('action', action);
  url.searchParams.append('apikey', API_KEY || 'default_api_key');
  url.searchParams.append('address', address);

  // Append additional parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value as string);
  });

  try {
    const response = await axios.get(url.toString());

    if (response.data.status !== '1') {
      console.error(`Error fetching data from Etherscan: ${response.data.message}`);
      return { status: 'error', message: response.data.message };
    } 
    return response.data.result;


  } catch (error) {
    console.error(`Error fetching data from Etherscan: ${error}`);
    return { status: 'error', message: 'Failed to fetch data' };
  }
}

export async function getTokenHoldings(walletAddress: string) {
  return await fetchFromEtherscan('account', 'tokenbalance', walletAddress);
}

export async function getTransactions(walletAddress: string) {
  const extraParams = { startblock: '0', endblock: '999999999', sort: 'asc' };
  return await fetchFromEtherscan('account', 'txlist', walletAddress, extraParams);
}

export async function getEthBalance(walletAddress: string) {
  return await fetchFromEtherscan('account', 'balance', walletAddress);
}

export async function getTokenTransactions(walletAddress: string) {
  const extraParams = { startblock: '0', endblock: '999999999', sort: 'asc' };

  return await fetchFromEtherscan('account', 'tokentx', walletAddress, extraParams);
}
