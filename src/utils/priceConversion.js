/**
 * Convert USD amount to satoshis
 * @param {number} usdAmount - Amount in USD
 * @param {number} btcPrice - Current BTC price in USD
 * @returns {number} Amount in satoshis (rounded to nearest integer)
 */
export function usdToSats(usdAmount, btcPrice) {
  if (!btcPrice || btcPrice <= 0) {
    return 0;
  }
  // 1 BTC = 100,000,000 sats
  // sats = (USD / BTC_price) * 100,000,000
  const btcAmount = usdAmount / btcPrice;
  const sats = btcAmount * 100000000;
  return Math.round(sats);
}

/**
 * Format satoshis for display
 * @param {number} sats - Amount in satoshis
 * @returns {string} Formatted string with commas
 */
export function formatSats(sats) {
  return sats.toLocaleString();
}

