import { PaymentMethod } from '@stripe/stripe-js';
import {
  Address,
  CuisineSymbol,
  DateObject,
  EventTrigger,
  PaymentDetails,
} from '.';

export enum UserRole {
  EATER = 'eater',
  ADMIN = 'admin',
  RESTAURANT = 'restaurant',
}

export interface RecentSearch {
  query: string;
  timestamp: number;
}

export type FavouriteCuisine = {
  existing: CuisineSymbol | 'ALL_FOOD' | null;
  other: string | null;
};

//
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//                          USER DATA                         //
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// Corresponds to document fields in Firestore
export enum UserDataKey {
  ROLE = 'role',
  DISPLAY_NAME = 'displayName',
  BOOKINGS = 'bookings',
  COVERS = 'covers',
  PROFILE_PICTURE_URL = 'profilePictureUrl',
  REFERRED_FROM = 'referredFrom',

  METRICS = 'metrics',

  RESTAURANTS_VISITED = 'restaurantsVisited',
  SAVED_ARTICLES = 'savedArticles',

  DETAILS = 'details',
  PAYMENT_DETAILS = 'paymentDetails',
  PAYMENT_METHODS = 'paymentMethods',
  PREFERENCES = 'preferences',
  PASSWORD_RESET_REQUESTS = 'passwordResetRequests',

  // Activity such as sessions, where they came from, etc.
  ACTIVITY = 'activity',
  USER_DEVICE = 'userDevice',
}

export interface UserSession {
  userId: string | null;
  anonymousId: string | null;
  userAgent: string;
  device: 'mobile' | 'tablet' | 'desktop';
  sessionStartTimestamp: number;
  sessionEndTimestamp: number | null;
  pagesVisited: string[];
  sessionUTMs: {
    utm_campaign: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_content: string | null;
    utm_term: string | null;
  };
  eventsTriggered: EventTrigger[];
}

export interface PasswordResetRequest {
  token: string; // generated randomly
  hasOpened: boolean; // has opened the link in their email?
  hasConfirmed: boolean; // has password actually changed?
  createdAt: number | null; // timestamp
  confirmedAt: number | null; // timestamp
}

export interface UserDetails {
  // Lookup latitude and longitude using Mapbox API to search by location
  // with contentful
  firstName: string | null;
  lastName: string | null;
  address: Address | null;
  postalCode: string | null;
  birthday: DateObject | null;
  email: string | null;
  mobile: string | null;
  lastActive: number | null;
}

export interface UserPreferences {
  // In order of decreasing proference. Max of three.
  favouriteCuisines:
    | [FavouriteCuisine?, FavouriteCuisine?, FavouriteCuisine?]
    | null;
}

export type FollowedRestaurant = {
  restaurantId: string;
  notifications: boolean; // get updates for available bookings, etc
};

export interface UserMetrics {
  totalBookings: number;
  totalSpent: { [currency: string]: number };

  recentSearches: Array<RecentSearch>;

  // List of RestaurantIds
  restaurantsVisited: string[];
  restaurantsFollowed: FollowedRestaurant[];
}

interface PaymentMethods {
  [key: string]: PaymentMethod;
}

// prettier-ignore
export type TUserData<T extends UserDataKey> =
      T extends UserDataKey.ROLE ? UserRole :
  
      // User profile
      T extends UserDataKey.PROFILE_PICTURE_URL ? string :
      T extends UserDataKey.REFERRED_FROM ? string :
  
      // User favourites
      T extends UserDataKey.SAVED_ARTICLES ? Array<string> :
  
      // User activity
      T extends UserDataKey.METRICS ? UserMetrics :
      // T extends UserDataKey.ACTIVITY ? Array<UserSession> :
          
      // User details and preferences
      T extends UserDataKey.DETAILS ? Partial<UserDetails> :
      T extends UserDataKey.PREFERENCES ? Partial<UserPreferences> :
      T extends UserDataKey.PASSWORD_RESET_REQUESTS ? PasswordResetRequest[] :
  
      // Payment information from Stripe
      T extends UserDataKey.PAYMENT_DETAILS ? Partial<PaymentDetails> :
      T extends UserDataKey.PAYMENT_METHODS ? PaymentMethods :
  
      // User orders
      T extends UserDataKey.RESTAURANTS_VISITED ? Array<string> :
  
      never;

export type UserData = {
  [key in UserDataKey]: TUserData<key>;
};
