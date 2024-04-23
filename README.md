This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Run tests

```bash
npm run test
``````

## API 

# Endpoint Documentation

This project encompasses an API designed for Ethereum wallet profiling, which processes POST requests containing a wallet address. It evaluates Ethereum and token balances and transaction history to calculate the wallet's portfolio value in USD and provides a summary of recent activities.
It uses the CoinGecko API to fetch token prices and the Etherscan API to retrieve wallet data.
Here's a detailed overview of its functionality, response mechanisms, and security measures.

## Endpoint Usage

**URL Path**: `/api/wallet`  
**Method**: `POST`  
**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <API_SECRET_KEY>`

**Request Body**:
```json
{
 "walletAddress": "0x..."
}
```
### Success Response:

**Code**: 200

**Content**:
```json
{
    "totalValueUSD": "12345.67",
    "tokenHoldings": {
      "ETH": "10.5",
      "DAI": "1000"
    },
    "summaryLastMonth": {
      "totalInUsd": "5000",
      "totalOutUsd": "2000"
    }

}
```

### Error Response:
**Code**: 401
***Content***:
```json
{
    "error": "Unauthorized"
}
```

### Future Improvements

1. **Security**:
* Implement a better authentication mechanism instead of using a static API key.
* Implemet rate limiting to prevent abuse.

2. **Performance**:
* Consolidate caching mechanisms to reduce the number of API calls. Right now it's only caching the token prices and using flat-cache saving data to the disk. Something like Redis would be a better option.
* Implement a queue system to handle multiple requests concurrently.






