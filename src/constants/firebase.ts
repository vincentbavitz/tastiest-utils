import { FirebaseAuthError } from '../types';

export interface IFirestore {
  data: any;
}

const ERROR_MESSAGES = {
  [FirebaseAuthError.INVALID_EMAIL]: 'Please enter a valid email address.',
  [FirebaseAuthError.INVALID_PASSWORD]:
    'Please include at least six characters in your password.',
  [FirebaseAuthError.EMAIL_ALREADY_EXISTS]:
    'An account already exists wiith this email.',
  [FirebaseAuthError.USER_NOT_FOUND]:
    "We couldn't find your account. Why not sign up now?",
  [FirebaseAuthError.OTHER]: 'There was an unknown error.',
};

const FIREBASE = {
  ERROR_MESSAGES,
  MAX_LOGIN_ATTEMPTS: 3,
  ORDER_REQUEST_MAX_AGE_MS: 86400000, // 1 day,
};

export const getFunctionsEndpoint = (region = 'europe-west3') =>
  `https://${region}-tastiest-dishes.cloudfunctions.net`;

export default FIREBASE;