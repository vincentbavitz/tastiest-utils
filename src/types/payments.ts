import { StripeErrorType } from '@stripe/stripe-js';
import Stripe from 'stripe';
import { IDeal } from './cms';

export type DiscountAmount = { value: number; unit: '%' | '£' };

export type Currency = 'GBP' | 'USD' | 'EUR' | 'AUD';
export type OrderPrice = {
  gross: number;
  final: number; // After discount and etc applied
  currency: Currency;
};

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
  // For emails and support
  userFacingOrderId: string;

  // To validate clientside before user logs in
  token: string;
  deal: IDeal;
  userId: string;
  heads: number;
  fromSlug: string;
  price: OrderPrice;
  paymentMethod: null | string;
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
  userFacingBookingId: string;
  restaurantId: string;
  eaterName: string;
  dealName: string;
  heads: number;
  price: OrderPrice;
  paidAt: number;
  bookingDate: number | null;
  hasBooked: boolean;
  hasArrived: boolean;
  hasCancelled: boolean;
  cancelledAt: number | null;

  // Code required when customer enters restaurant
  confirmationCode: string;
  isConfirmationCodeVerified: boolean;
}

export interface IPaymentDetails {
  // https://stripe.com/docs/payments/save-and-reuse#web-create-setup-intent
  stripeCustomerId: string;
  stripeSetupSecret: string;
  paymentMethods: string[];
}

export enum CardBrand {
  VISA = 'VISA',
  MASTERO = 'MASTERO',
  MASTERCARD = 'MASTERCARD',
}

///////////////////////////////////////////////
//////////// User Facing Validation ///////////
///////////////////////////////////////////////
export type TastiestPaymentErrorCode =
  | Stripe.RawErrorType
  | 'update_order_error'
  | 'general_payment_error'
  | 'incomplete_cardholder_name';

export type TastiestPaymentErrorType =
  | StripeErrorType
  | 'tastiest-payment-error';

// Used for user facing error reporting in the checkout flow.
export interface TastiestPaymentError {
  code: TastiestPaymentErrorCode;
  type: TastiestPaymentErrorType;
  message: string;
}
