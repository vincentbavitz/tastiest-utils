import { postFetch } from './api';

export const ERROR_REPORTING_FUNCTION_ENDPOINT = '';

export enum TastiestInternalErrorCode {
  STRIPE_SETUP_INTENT_FAILURE = 'STRIPE_SETUP_INTENT_FAILURE',
}

export interface TastiestInternalError {
  code: TastiestInternalErrorCode;
  // The error as reported from try/catch block, for example
  raw: string;
  // The message as given in the admin panel,
  message: string;
  timestamp: number;
  originFile: string;
  // Any properties related to the error. Eg. userId, orderId
  properties: any;
}

export function reportInternalError(errorParams: TastiestInternalError) {
  return postFetch(ERROR_REPORTING_FUNCTION_ENDPOINT, { params: errorParams });
}
