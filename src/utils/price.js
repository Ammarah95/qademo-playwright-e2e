/**
 * "$1,059.99" -> 1059.99
 * @param {string} text
 */
function parsePrice(text) {
  const n = Number(String(text).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(n)) throw new Error(`Cannot parse price from "${text}"`);
  return n;
}

/**
 * 59.99 -> "$59.99"
 * @param {number} amount
 */
function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

/** Sums money values safely (avoids floating-point drift). */
function sumPrices(...amounts) {
  return Math.round(amounts.reduce((acc, a) => acc + a * 100, 0)) / 100;
}

module.exports = { parsePrice, formatPrice, sumPrices };
