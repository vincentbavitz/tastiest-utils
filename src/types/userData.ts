import { ILocation } from './cms';
import { CuisineSymbol } from './cuisine';
import { IPaymentDetails } from './payments';

export enum UserData {
  DISPLAY_NAME = 'displayName',
  BOOKINGS = 'bookings',
  COVERS = 'covers',
  RECENT_SEARCHES = 'recentSearches',
  PROFILE_PICTURE_URL = 'profilePictureUrl',
  REFERRED_FROM = 'referredFrom',

  RESTAURANTS_VISITED = 'restaurantsVisited',
  SAVED_ARTICLES = 'savedArticles',

  DETAILS = 'details',
  PAYMENT_DETAILS = 'paymentDetails',
  PREFERENCES = 'preferences',

  USER_SESSIONS = 'userSessions',
  USER_DEVICE = 'userDevice',
}

export enum FirebaseAuthError {
  INVALID_EMAIL = 'auth/invalid-email',
  INVALID_PASSWORD = 'auth/invalid-password',
  EMAIL_ALREADY_EXISTS = 'auth/email-already-exists',
  WRONG_PASSWORD = 'auth/wrong-password',
  USER_NOT_FOUND = 'auth/user-not-found',
  OTHER = 'other',
}

export interface IUserSession {
  device: 'mobile' | 'tablet' | 'desktop';
  sessionStartTimestamp: number;
  sessionEndTimestamp: number;
}

export interface IRecentSearch {
  query: string;
  timestamp: number;
}

export type TFavouriteCuisine = {
  existing: CuisineSymbol | 'ALL_FOOD' | null;
  other: string | null;
};

export interface IUserDetails {
  // Lookup latitude and longitude using Mapbox API to search by location
  // with contentful
  firstName: string | null;
  lastName: string | null;
  address: ILocation | null;
  birthday: IDateObject | null;
  email: string | null;
  mobile: string | null;
}

export interface IUserPreferences {
  // In order of decreasing proference. Max of three.
  favouriteCuisines:
    | [TFavouriteCuisine?, TFavouriteCuisine?, TFavouriteCuisine?]
    | null;
}

// prettier-ignore
export type TUserData<T extends UserData> =
    // User profile
    T extends UserData.DISPLAY_NAME ? string :
    T extends UserData.PROFILE_PICTURE_URL ? string :
    T extends UserData.REFERRED_FROM ? string :

    // User actions
    T extends UserData.RECENT_SEARCHES ? Array<IRecentSearch> :

    // User favourites
    T extends UserData.SAVED_ARTICLES ? Array<string> :

    // User metadata
    T extends UserData.USER_SESSIONS ? Array<IUserSession> :
        
    // User details and preferences
    T extends UserData.DETAILS ? Partial<IUserDetails> :
    T extends UserData.PAYMENT_DETAILS ? Partial<IPaymentDetails> :
    T extends UserData.PREFERENCES ? Partial<IUserPreferences> :

    // User orders
    T extends UserData.RESTAURANTS_VISITED ? Array<string> :

    never;

export type IUserData = {
  [key in UserData]: TUserData<key>;
};

// Support requests and so forth!
export enum SupportRequestType {
  GENERAL = 'GENERAL',
  ORDER = 'ORDER',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG = 'BUG',
  OTHER = 'OTHER',
}

export interface ISupportMessage {
  // TODO - Allow formatting in the future
  name: string;
  message: string;
  timestamp: number;
  role: 'user' | 'restaurant' | 'support';
}

// User requests are stored in Firestore as support-users/<list of support requests>
// We can't store in terms of user IDs because they might not have an account.
export interface IUserSupportRequest {
  userId: string | null;
  name: string;
  email: string;
  type: SupportRequestType;
  subject: string;
  conversation: ISupportMessage[];
  priority: 'critical' | 'high' | 'normal' | 'low';
  seen: boolean;
  resolved: boolean;
  // Timestamps
  openedAt: number;
  updatedAt: number;
}

export interface IDateObject {
  day: TDay;
  month: TMonth;
  year: TYear;
}

// eslint-disable-next-line prettier/prettier
export type TDay =
  | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `${1 | 2}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `3${0 | 1}`;
export type TMonth = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;
export type TYear =
  | `${19}${3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `${20}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${
      | 0
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9}`;
