import { EventTrigger } from '.';

export enum UserRole {
  EATER = 'eater',
  ADMIN = 'admin',
  RESTAURANT = 'restaurant',
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

// export interface PasswordResetRequest {
//   token: string; // generated randomly
//   hasOpened: boolean; // has opened the link in their email?
//   hasConfirmed: boolean; // has password actually changed?
//   createdAt: number | null; // timestamp
//   confirmedAt: number | null; // timestamp
// }

// export type FavouriteCuisine = {
//   existing: CuisineSymbol | 'ALL_FOOD' | null;
//   other: string | null;
// };

// export interface UserPreferences {
//   // In order of decreasing proference. Max of three.
//   favouriteCuisines:
//     | [FavouriteCuisine?, FavouriteCuisine?, FavouriteCuisine?]
//     | null;
// }

// export interface PaymentMethods {
//   [key: string]: PaymentMethod;
// }
