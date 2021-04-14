import { ILocation, IRestaurant } from './cms';
import { CuisineSymbol } from './cuisine';
import { IPaymentDetails } from './payments';

// Return type for async requests
export interface IGenericAsyncReturnType {
  success: boolean;
  error: Error | null;
}

//
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//                          USER DATA                         //
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
// Corresponds to document fields in Firestore
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

//
////////////////////////////////////////////////////////////////
//                        RESTAURANT DATA                     //
////////////////////////////////////////////////////////////////
// Corresponds to document fields in Firestore
export enum RestaurantData {
  DETAILS = 'details',
  FINANCIAL = 'financial',
  BOOKINGS = 'bookings',
  INVOICES = 'invoices',
}

export interface IRestaurantFinancialDetails {
  paymentIntervalDays: number;
  tastiestCommission: number;
  revenuedFromTastiest: number;
}

export interface IRestaurantBookingDetails {
  totalBookings: number;
  totalCovers: number;
}

// prettier-ignore
export type TRestaurantData<T extends RestaurantData> =
    // User details and preferences
    T extends RestaurantData.DETAILS ? Partial<IRestaurant> :

    // Further information
    T extends RestaurantData.FINANCIAL ? IRestaurantFinancialDetails:
    T extends RestaurantData.BOOKINGS ? IRestaurantBookingDetails :

    never;

export type IRestaurantData = {
  [key in RestaurantData]: TRestaurantData<key>;
};

//
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//                 USER AND RESTAURANT SUPPORT                //
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
// Support requests and so forth
export enum SupportRequestType {
  GENERAL = 'GENERAL',
  ORDER = 'ORDER',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG = 'BUG',
  OTHER = 'OTHER',
}

export enum SupportMessageDirection {
  RESTAURANT_TO_SUPPORT = 'RESTAURANT_TO_SUPPORT',
  SUPPORT_TO_RESTAURANT = 'SUPPORT_TO_RESTAURANT',
  USER_TO_SUPPORT = 'USER_TO_SUPPORT',
  SUPPORT_TO_USER = 'SUPPORT_TO_USER',
}

export interface ISupportMessage {
  // TODO - Allow formatting in the future
  name: string;
  message: string;
  timestamp: number;
  direction: SupportMessageDirection;
  hasOpened: boolean;
  recipientHasOpened: boolean;
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
  createdAt: number;
  updatedAt: number;
}

// Queries are unlike support requests in that they don't
// require a conversation or priority.
// For example, user letting us know what they expected on /404
export enum UserQueryType {
  _404_PAGE = '_404_PAGE',
}

export interface IUserQuery {
  name: string;
  email: string;
  message: string;
  userId: string | null;
  type: UserQueryType;
  seen: boolean;
  resolved: boolean;
  createdAt: number;
}

// User requests are stored in Firestore as support-restaurants/<restaurantId>
export interface IRestaurantSupportRequest {
  restaurantId: string | null;
  name: string;
  email: string;
  // No types for restaurants yet
  // type: SupportRequestType;
  subject: string;
  conversation: ISupportMessage[];
  priority: 'critical' | 'high' | 'normal' | 'low';
  seen: boolean;
  resolved: boolean;
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

//
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//                VARIOUS USEFUL TYPES FOR DATA               //
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
export interface IDateObject {
  day: TDay;
  month: TMonth;
  year: TYear;
}

// prettier-ignore
export type TDay = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30' | '31';
// prettier-ignore
export type TMonth = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
// prettier-ignore
export type TYear =
| '1933' | '1934' | '1935' | '1936' | '1937' | '1938' | '1939' 
| '1940' | '1941' | '1942' | '1943' | '1944' | '1945' | '1946' 
| '1947' | '1948' | '1949' | '1950' | '1951' | '1952' | '1953' 
| '1954' | '1955' | '1956' | '1957' | '1958' | '1959' | '1960' 
| '1961' | '1962' | '1963' | '1964' | '1965' | '1966' | '1967' 
| '1968' | '1969' | '1970' | '1971' | '1972' | '1973' | '1974' 
| '1975' | '1976' | '1977' | '1978' | '1979' | '1980' | '1981' 
| '1982' | '1983' | '1984' | '1985' | '1986' | '1987' | '1988' 
| '1989' | '1990' | '1991' | '1992' | '1993' | '1994' | '1995' 
| '1996' | '1997' | '1998' | '1999' | '2000' | '2001' | '2002' 
| '2003' | '2004' | '2005' | '2006' | '2007' | '2008' | '2009' 
| '2010' | '2011' | '2012' | '2013' | '2014' | '2015' | '2016' 
| '2017' | '2018' | '2019' | '2020' | '2021' | '2022' | '2023' 
| '2024' | '2025' | '2026' | '2027' | '2028' | '2029' | '2030' 
| '2031' | '2032' | '2033' | '2034' | '2035' | '2036' | '2037'
| '2038' | '2039' | '2040' | '2041' | '2042' | '2043' | '2044'
| '2045' | '2046' | '2047' | '2048' | '2049' | '2050' | '2051'
| '2052' | '2053' | '2054' | '2055' | '2056' | '2057' | '2058'
| '2059' | '2060' | '2061' | '2062' | '2063' | '2064' | '2065'
| '2066' | '2067' | '2068' | '2069' | '2070' | '2071' | '2072'
| '2073' | '2074' | '2075' | '2076' | '2077' | '2078' | '2079'
| '2080' | '2081' | '2082' | '2083' | '2084' | '2085' | '2086'
| '2087' | '2088' | '2089' | '2090' | '2091' | '2092' | '2093'
| '2094' | '2095' | '2096' | '2097' | '2098' | '2099';
