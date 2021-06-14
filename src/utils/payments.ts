export const transformPriceForStripe = (price: number) =>
  Math.round(price * 100);

export const transformPriceFromStripe = (price: number) =>
  price === 0 ? 0 : price / 100;
