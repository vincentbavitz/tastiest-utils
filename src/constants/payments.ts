const PAYMENTS = {
  // Order expires after one week
  ORDER_EXPIRY_MS: 1000 * 60 * 60 * 24 * 7,
  PROMO_CODE_REGEX: /^[A-Z0-9-_]{1,20}$/,
};

export default PAYMENTS;
