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
