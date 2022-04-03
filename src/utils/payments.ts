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
