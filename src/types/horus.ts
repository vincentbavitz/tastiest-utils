import { ExperienceProduct } from '.';
import {
  CurrencyValue,
  OrderPrice,
  PaymentCardDetails,
  PaymentDetails,
  RefundDetails,
} from './payments';
import { UserMetrics, UserPreferences } from './user';

/**
 * A collection of types coming form Horus, the tastiest-backend.
 */

export interface HorusUserEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;

  isTestAccount: boolean;
  lastActive: Date | null;

  mobile: string | null;
  birthday: Date | null;
  location: HorusLocationEntity | null;

  metrics: Partial<UserMetrics>;
  preferences: Partial<UserPreferences>;
  financial: Partial<PaymentDetails>;

  orders: HorusOrderEntity[] | null;
}

export interface HorusOrderEntity {
  id?: string;
  token: string;
  userFacingOrderId: string;

  heads: number;

  user?: HorusUserEntity | null;
  booking?: HorusBookingEntity | null;
  restaurant?: HorusRestaurantEntity | null;

  experience: ExperienceProduct;
  price: OrderPrice;
  refund: RefundDetails | null;
  bookedFor: Date;
  discountCode: string | null;
  fromSlug: string;

  paymentMethod: string | null;
  paymentCard: PaymentCardDetails | null;

  paidAt: Date | null;
  createdAt: Date | null;
  abandonedAt: Date | null;

  tastiestPortion: CurrencyValue;
  restaurantPortion: CurrencyValue;

  isUserFollowing: boolean;
  isTest: boolean;
}

export interface HorusBookingEntity {
  id: string;
}

export interface HorusRestaurantEntity {
  id: string;
}

export interface HorusLocationEntity {
  lat: number | null;
  lon: number | null;
  address: string | null;
  postcode: string | null;
  display: string | null;
}
