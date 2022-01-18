export const transformPriceForStripe = (price: number) =>
  Math.round(price * 100);

export const transformPriceFromStripe = (price: number) =>
  price === 0 ? 0 : price / 100;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate the payment processing fees to pass them onto the payer.
 * Fees taken from https://stripe.com/gb/pricing under non-European cards.
 *
 * We take the higher-fee structure because we can't predict in advance the card
 * being used when calculating the fees.
 *
 * Assumes that all values are in GBP and that the given price parameter is
 * the price after promos, discounts and etc.
 */
export const calculatePaymentFees = (price: number) => {
  // 2.9 % + 0.20
  const PAYMENT_FEE_PERCENTAGE = 0.029;
  const PAYMENT_FEE_FLAT_RATE = 0.2;

  const fees = price * PAYMENT_FEE_PERCENTAGE + PAYMENT_FEE_FLAT_RATE;

  return {
    total: price + fees,
    fees: fees,
  };
};
