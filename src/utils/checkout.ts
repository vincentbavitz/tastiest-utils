/**
 * Generate user facing IDs.
 * For orders, bookings, products, etc.
 */
export function generateUserFacingId(length = 9): string {
  return Array(length)
    .fill(undefined)
    .map(_ => String(Math.floor(Math.random() * 10)))
    .join('');
}

/**
 * Confirmation code required for user to show restaurant
 */
export const generateConfirmationCode = () => {
  // Random number between 1 and 9
  const randomDigit = () => Math.floor(Math.random() * 10);

  return Array(4)
    .fill(null)
    .map(_ => String(randomDigit()))
    .join('');
};
