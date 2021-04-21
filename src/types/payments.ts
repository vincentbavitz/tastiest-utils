import { IDeal } from './cms';

export type DiscountAmount = { value: number; unit: '%' | '£' };

export interface IPromo {
  name: string;
  code: string;
  discount: DiscountAmount;
  validTo: number;
  maximumUses: number | null;
  validForSlugs?: 'all' | string[];
  validForUsersIds?: 'all' | string[];
}

// Order type in the raw DB form
// We don't want the IDeal etc stored here directly,
// as the user generates this  information client side.
// We get the actual deal informatiuon server-side from Contentful
export interface IOrderRequest {
  dealId?: string;
  userId?: string;
  heads?: number;
  fromSlug?: string;
  timestamp?: number;
  promoCode?: string;
}

export interface IOrder {
  id: string;
  // To validate clientside before user logs in
  token: string;
  deal: IDeal;
  userId: string;
  heads: number;
  fromSlug: string;
  price: {
    gross: number;
    final: number; // After discount and etc applied
  };
  paymentDetails: null | IPaymentDetails;
  promoCode: string;

  // Timestamps
  // Null denotes not paid yet; not done yet.
  paidAt: null | number;
  createdAt: null | number;
  abandonedAt: null | number;

  refund: null | {
    amountGBP: number;
    timestamp: number;
  };
}

// This is what the restaurant sees after eater pays
// Stored in firestore/bookings
export interface IBooking {
  orderId: string;
  restaurantId: string;
  eaterName: string;
  dealName: string;
  heads: number;
  orderTotal: number;
  paidAt: number;
  bookingDate: number | null;
  hasBooked: boolean;
  hasEaten: boolean;
}

export interface IPaymentDetails {
  stripeCustomerId: string;
  stripeSetupSecret: string;
}

export enum CardBrand {
  VISA = 'VISA',
  MASTERO = 'MASTERO',
  MASTERCARD = 'MASTERCARD',
}
