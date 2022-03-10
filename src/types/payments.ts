import { StripeErrorType } from '@stripe/stripe-js';
import { DiscountAmount } from '@tastiest-io/tastiest-horus';
import Stripe from 'stripe';

export interface Promo {
  name: string;
  code: string;
  validTo: number;
  discount: DiscountAmount;
  maximumUses: number | null;
  validForSlugs?: 'all' | string[];
  validForUsersIds?: 'all' | string[];
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
