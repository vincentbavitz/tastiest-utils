import {
  dlog,
  FirestoreCollection,
  FunctionsResponse,
  RestaurantData,
  RestaurantDataApi,
  UserRole,
} from '@tastiest-io/tastiest-utils';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { firebaseAdmin } from './admin';

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? functions.config().stripe?.secret_test
    : functions.config().stripe?.secret_live;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Analytics = require('analytics-node');
const analytics = new Analytics(functions.config().segment.write_key);

/**
 * Restaurant onbaording flow.
 */
export const restaurantCreated = functions.firestore
  .document(`${FirestoreCollection.RESTAURANTS}/{restaurantId}`)
  .onCreate(async (snap, context) => {
    const { restaurantId } = context.params ?? '';

    dlog('restaurantOnboarding ➡️ restaurantId:', restaurantId);

    try {
      // Track restaurant onboarding
      analytics.track({
        userId: restaurantId,
        event: `Restauraut onboarded`,
        properties: {},
      });

      // Set TOS acceptance to false until they explicitly sign in
      const restaurantDataApi = new RestaurantDataApi(admin, restaurantId);
      restaurantDataApi.setRestaurantData(RestaurantData.LEGAL, {
        hasAcceptedTerms: false,
      });

      // Set custom user claim (user role) to `restaurant`
      // (as apposed to `eater`, `admin`) so their account
      // can log into the dashboard only.
      admin.auth().setCustomUserClaims(restaurantId, {
        [UserRole.RESTAURANT]: true,
      });
    } catch (error) {
      dlog('Error: ', error);
    }
  });

/** Stripe Webhook: Restaurant Connected Acconut created */
export const connectAccountCreated = functions.https.onRequest(
  async (request, response: functions.Response<FunctionsResponse>) => {
    const body = request.body;

    firebaseAdmin.firestore().collection('aaaa').add({ body });

    stripe.accounts.create;
    response.json({
      data: null,
      error: null,
      success: true,
    });
  },
);
