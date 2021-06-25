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
  RESTAURANTS = 'restaurants',

  // Orders and payments
  ORDERS = 'orders',
  BOOKINGS = 'bookings',

  // User recommendations and queries
  USER_QUERIES = 'user-queries',
  SUGGESTIONS_RESTAURANTS = 'suggestions-restaurants',

  // Support conversations
  SUPPORT_USERS = 'support-users',
  SUPPORT_RESTAURANTS = 'support-restaurants',

  // User sessions and activity
  SESSIONS = 'sessions',
}

export interface FirebaseAdminCert {
  privateKey: string;
  clientEmail: string;
  projectId: string;
}
