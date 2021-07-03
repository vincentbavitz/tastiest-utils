import { postFetch } from './api';

export const ERROR_REPORTING_FUNCTION_ENDPOINT =
  'https://us-central1-tastiest-dishes.cloudfunctions.net/reportInternalError';

export enum TastiestInternalErrorCode {
  INTERNAL_ERROR_REPORTING = 'INTERNAL_ERROR_REPORTING_ERROR', // When there's an error in the error reporting.
  FUNCTIONS_ERROR = 'FUNCTIONS_ERROR', // An error originating from Firebase Functions
  STRIPE_SETUP_INTENT = 'STRIPE_SETUP_INTENT',
}

/** The rrror reporting schema for the Tastiest Admin Panel.
 *   `code`: TastiestInternalErrorCode;
 *   `message`: string         | the message as seen in the Tastiest Admin Panel
 *   `timestamp`: number       | in milliseconds
 *   `originFile`: string      | the originating file
 *   `properties`: any         | Any properties related to the error. Eg. userId, orderId.
 *   `shouldAlert`: boolean    | Should this error trigger an email alert?
 *   `raw`: string (optional)  | the error as reported by a try/catch block, for example.
 *
 */
export interface TastiestInternalError {
  code: TastiestInternalErrorCode;
  message: string;
  timestamp: number;
  originFile: string;
  shouldAlert: boolean;
  properties: any;
  raw?: string;
}

export function reportInternalError(params: TastiestInternalError) {
  return postFetch(ERROR_REPORTING_FUNCTION_ENDPOINT, params);
}
