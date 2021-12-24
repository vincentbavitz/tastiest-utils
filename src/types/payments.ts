import { StripeErrorType } from '@stripe/stripe-js';
import Stripe from 'stripe';
import { RestaurantDetails } from '.';
import { ExperienceProduct } from './cms';

export type DiscountAmount = { value: number; unit: '%' | '£' };

export type Currency = 'GBP' | 'USD' | 'EUR' | 'AUD';
export type OrderPrice = {
  subtotal: number;

  /** After discount and etc applied */
  final: number;
  currency: Currency;
};

export interface Promo {
  name: string;
  code: string;
  validTo: number;
  discount: DiscountAmount;
  maximumUses: number | null;
  validForSlugs?: 'all' | string[];
  validForUsersIds?: 'all' | string[];
}

// Order type in the raw DB form
// We don't want the ExperienceProduct etc stored here directly,
// as the user generates this  information client side.
// We get the actual deal informatiuon server-side from Contentful
export interface OrderRequest {
  dealId?: string;
  userId?: string;
  anonymousId?: string;
  heads?: number;
  fromSlug?: string;
  timestamp?: number;
  promoCode?: string;
  userAgent?: string;
  bookedForTimestamp?: number;
}

export interface Order {
  id: string;
  // For emails and support
  userFacingOrderId: string;

  // To validate clientside before user logs in
  token: string;
  deal: ExperienceProduct;
  userId: string;
  heads: number;
  fromSlug: string;
  price: OrderPrice;
  paymentMethod: null | string;
  paymentCard: null | {
    brand: string;
    last4: string;
  };
  promoCode: string;

  // Timestamps
  // Null denotes not paid yet; not done yet.
  paidAt: null | number;
  createdAt: null | number;
  abandonedAt: null | number;
  bookedForTimestamp: number;

  refund: null | {
    amountGBP: number;
    timestamp: number;
  };

  // Filled out after payment is complete.
  tastiestCut: null | { amount: number; currency: Currency };
  restaurantCut: null | { amount: number; currency: Currency };

  isUserFollowing: boolean;
  isTest: boolean;
}

/** What the restaurant sees after eater pays */
export interface Booking {
  orderId: string;
  userId: string;
  restaurant: RestaurantDetails;
  userFacingBookingId: string;
  restaurantId: string;
  eaterName: string;
  eaterMobile: string;
  eaterEmail: string;
  dealName: string;
  heads: number;
  price: OrderPrice;
  paidAt: number;
  hasBooked: boolean;
  hasArrived: boolean;
  hasCancelled: boolean;
  cancelledAt: number | null;
  bookedForTimestamp: number;
  bookedForHumanDate: string;

  /** Code required when customer enters restaurant */
  confirmationCode: string;
  isConfirmationCodeVerified: boolean;

  /** Synced with restaurant's external booking system? */
  isSyncedWithBookingSystem: boolean;

  // Calculate cuts per booking, as default rates can change over time.
  restaurantCut: { amount: number; currency: Currency };

  isUserFollowing: boolean;
  isTest: boolean;
}

export interface PaymentDetails {
  // https://stripe.com/docs/payments/save-and-renuse#web-create-setup-intent
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
