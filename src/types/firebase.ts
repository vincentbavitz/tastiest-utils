export enum FirebaseAuthError {
  INVALID_EMAIL = 'auth/invalid-email',
  INVALID_PASSWORD = 'auth/invalid-password',
  EMAIL_ALREADY_EXISTS = 'auth/email-already-exists',
  WRONG_PASSWORD = 'auth/wrong-password',
  USER_NOT_FOUND = 'auth/user-not-found',
  OTHER = 'other',
}

// All of the Tastiest Firestore collection items
export enum FirestoreCollection {
  // Eaters!
  USERS = 'users',
  USERS_ARCHIVE = 'users-archive',

  RESTAURANTS = 'restaurants',

  // Orders and payments
  ORDERS = 'orders',
  BOOKINGS = 'bookings',
  ORDERS_ARCHIVE = 'orders-archive',
  BOOKINGS_ARCHIVE = 'bookings-archive',

  // User recommendations and queries
  USER_QUERIES = 'user-queries',
  SUGGESTIONS = 'suggestions',

  // Support conversations
  SUPPORT_USERS = 'support-users',
  SUPPORT_RESTAURANTS = 'support-restaurants',

  // User sessions and activity
  SESSIONS = 'sessions',

  // Internal error reporting
  ERRORS = 'errors',
}

export interface FirebaseAdminCert {
  privateKey: string;
  clientEmail: string;
  projectId: string;
}
