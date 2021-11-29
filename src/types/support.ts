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
  OTHER = 'OTHER',
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
}

export enum SupportMessageDirection {
  RESTAURANT_TO_SUPPORT = 'RESTAURANT_TO_SUPPORT',
  SUPPORT_TO_RESTAURANT = 'SUPPORT_TO_RESTAURANT',
  USER_TO_SUPPORT = 'USER_TO_SUPPORT',
  SUPPORT_TO_USER = 'SUPPORT_TO_USER',
}

export interface SupportMessage {
  name: string;
  message: string;
  timestamp: number;
  hasOpened: boolean;
  recipientHasOpened: boolean;
  direction: SupportMessageDirection;
}

export enum UserQueryType {
  _404_PAGE = '_404_PAGE',
}

/**
 * Queries are unlike support requests in that they don't
 * require a conversation or priority.
 * For example, user letting us know what they expected on /404
 */
export interface UserQuery {
  email: string;
  message: string;
  userId: string | null;
  name: string | null;
  type: UserQueryType;
  seen: boolean;
  resolved: boolean;
  createdAt: number;
}

export interface GeneralSupportRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  resolved: boolean;
  seen: boolean;
  conversation: SupportMessage[];
  priority: 'critical' | 'high' | 'normal' | 'low';

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// User requests are stored in Firestore as support-users/<list of support requests>
// We can't store in terms of user IDs because they might not have an account.
export interface UserSupportRequest extends GeneralSupportRequest {
  userId: string | null;
  type: SupportRequestType;
}

// User requests are stored in Firestore as support-restaurants/<restaurantId>
export interface RestaurantSupportRequest extends GeneralSupportRequest {
  restaurantId: string | null;
  // No types for restaurants yet
  // type: SupportRequestType;
}
