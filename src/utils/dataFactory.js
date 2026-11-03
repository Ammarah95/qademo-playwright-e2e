const crypto = require('crypto');

/** Short unique suffix – safe across parallel workers and CI retries. */
function uniqueId() {
  return `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Builds a brand-new user that satisfies the site's password policy
 * (>= 8 chars, one uppercase letter, one number).
 * @param {Partial<{email:string,phone:string,username:string,password:string}>} overrides
 */
function buildUser(overrides = {}) {
  const id = uniqueId();
  return {
    email: `pw.e2e.${id}@example.com`,
    phone: `98${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`,
    username: `pwe2e${id}`.slice(0, 20),
    password: 'Autom@tion2026',
    ...overrides,
  };
}

/** Valid shipping + test-card payment data. */
function buildCheckoutData(overrides = {}) {
  return {
    shipping: {
      firstName: 'Ammarah',
      lastName: 'Tester',
      address: '221B Automation Street, Andheri East, Mumbai 400069',
      ...(overrides.shipping || {}),
    },
    payment: {
      cardNumber: '4242424242424242',
      expiry: '12/30',
      cvv: '123',
      nameOnCard: 'Ammarah Tester',
      ...(overrides.payment || {}),
    },
  };
}

module.exports = { uniqueId, buildUser, buildCheckoutData };
