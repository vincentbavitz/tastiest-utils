import { Document } from '@contentful/rich-text-types';
import Stripe from 'stripe';
import {
  Contact,
  CuisineSymbol,
  Media,
  MetaDetails,
  WeekOpenTimes,
  WeekQuietTimes,
  YouTubeVideo,
} from '.';
import { Email, EmailTemplate } from './email';
import { Address } from './geography';
import { UserRole } from './user';

//
////////////////////////////////////////////////////////////////
//                        RESTAURANT DATA                     //
////////////////////////////////////////////////////////////////

/** For user facing content. */
export interface RestaurantProfile {
  website: string;

  profilePicture: Media;
  backdropVideo: Media;
  backdropStillFrame: Media;

  // Properties that appear on the restaurant's page at /[city]/[cuisine]/[restaurant]
  heroIllustration: Media;
  description: Document;
  video: YouTubeVideo;
  publicPhoneNumber: string;
  meta: MetaDetails;
}

export interface RestaurantDetails {
  id: string;
  name: string;
  city: string;
  cuisine: CuisineSymbol;
  location: Address;

  // Contentful has a contact, but we don't want to
  // share that with the user.
  contact?: Contact;

  bookingSystem: string;
  businessType: 'restaurant' | 'take-away' | 'cafe';

  // This is the name as it appears in the URL. Eg. tastiest.io/london/bite-be-burger
  uriName: string;

  // Toggles
  isTest: boolean;
  isDemo: boolean;
  isArchived: boolean;
}

// Corresponds to document fields in Firestore
export enum RestaurantDataKey {
  ROLE = 'role',
  DETAILS = 'details',
  PROFILE = 'profile',
  FINANCIAL = 'financial',
  BOOKINGS = 'bookings',
  EMAIL = 'email',
  INVOICES = 'invoices',
  LEGAL = 'legal',
  METRICS = 'metrics',
  REALTIME = 'realtime',
}

export type RestaurantCommissionStructure = {
  defaultRestaurantCut: number;
  followersRestaurantCut: number;
};

export interface RestaurantFinancial {
  paymentIntervalDays: number;
  stripeConnectedAccount: Stripe.Account;
  commission: RestaurantCommissionStructure;
}

export interface RestaurantEmail {
  templates: { [id: string]: EmailTemplate };
  sent: Email[];
}

export interface RestaurantPayout {
  amountGbp: number;
  timestamp: number;
  daysSincePrevious: number;
}

export interface RestaurantBookingDetails {
  totalBookings: number;
  totalCovers: number;
  bookings: string[]; // Array of orderIds
  payouts: RestaurantPayout[];
}

export interface RestaurantLegal {
  hasAcceptedTerms: boolean;
}

export type RestaurantFollower = {
  userId: string;
  name: string;
  email: string;
  notifications: boolean;
  followedAt: number;
};

export interface RestaurantMetrics {
  followers: RestaurantFollower[];
  quietTimes: WeekQuietTimes;
  openTimes: WeekOpenTimes;

  // How long is each sit-down considered to be? (minutes)
  seatingDuration: number;
}

export interface RestaurantRealtime {
  // isServing: boolean;
  // bookings: RealtimeBooking[]; // can extract number of empty seats at any given time

  /** An array of ISO Date strings */
  availableBookingSlots: string[];
  lastBookingSlotsSync: number; // timestamp
}

// prettier-ignore
export type TRestaurantData<T extends RestaurantDataKey> =
      T extends RestaurantDataKey.ROLE ? UserRole.RESTAURANT :
      T extends RestaurantDataKey.PROFILE ? Partial<RestaurantProfile> :
      T extends RestaurantDataKey.DETAILS ? Partial<RestaurantDetails> :
  
      // Further information
      T extends RestaurantDataKey.FINANCIAL ? Partial<RestaurantFinancial>:
      T extends RestaurantDataKey.BOOKINGS ? RestaurantBookingDetails :
      T extends RestaurantDataKey.LEGAL ? RestaurantLegal :
      T extends RestaurantDataKey.EMAIL ? RestaurantEmail :
  
      // Metrics recorded periodically
      T extends RestaurantDataKey.METRICS ? RestaurantMetrics :
      
      // Realtime statistics such as tables open, etc.
      T extends RestaurantDataKey.REALTIME ? RestaurantRealtime :
  
      never;

export type RestaurantData = {
  [key in RestaurantDataKey]: TRestaurantData<key>;
};
