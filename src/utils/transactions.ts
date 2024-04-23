/**
 * Finds the closest price that is less than or equal to the given transaction timestamp.
 * Assumes `prices` is sorted by timestamp.
 * Each price data point is an array where price[0] is the timestamp and price[1] is the price.
 */
export function findPriceBefore(prices: [number, number][], transactionTimestamp: number): number | null {
    let low = 0;
    let high = prices.length - 1;
    let bestMatch = null;

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let midTimestamp = prices[mid][0];

        if (midTimestamp <= transactionTimestamp) {
            bestMatch = prices[mid][1];  // This price is before the transaction timestamp
            low = mid + 1;  // Continue searching to the right to find the closest timestamp
        } else {
            high = mid - 1;  // Search to the left
        }
    }

    return bestMatch;  // Returns the price, or null if no price found before the transaction timestamp
}
