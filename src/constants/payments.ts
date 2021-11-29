const PAYMENTS = {
  // Order expires after one week
  ORDER_EXPIRY_MS: 1000 * 60 * 60 * 24 * 7,
  PROMO_CODE_REGEX: /^[A-Z0-9-_]{1,20}$/,
  RESTAURANT_CUT_DEFAULT_PC: 90,
  RESTAURANT_CUT_FOLLOWERS_PC: 95,
};

export default PAYMENTS;
