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
  RESTAURANT_USERS = 'restaurant-users',

  // Orders and payments
  ORDERS = 'orders',
  ORDER_REQUESTS = 'order-requests',
  STRIPE_CUSTOMERS = 'stripe-customers',
  PAYMENT_METHODS = 'payment-methods',

  // User recommendations and queries
  USER_QUERIES = 'user-queries',
  SUGGESTIONS_RESTAURANTS = 'suggestions-restaurants',

  // Support conversations
  SUPPORT_USERS = 'support-users',
  SUPPORT_RESTAURANTS = 'support-restaurants',
}

export interface FirebaseAdminCert {
  privateKey: string;
  clientEmail: string;
  projectId: string;
}
