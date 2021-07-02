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
    ? functions.config().stripe?.secret_live
    : functions.config().stripe?.secret_test;

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

    const data: Stripe.Account = body?.data?.object;

    if (!data) {
      response.status(400).json({
        data: null,
        error: 'Invalid JSON format',
        success: false,
      });
      return;
    }

    const restaurantId = data?.metadata?.restaurantId;

    // If no restaurant ID was given, we didnt' set up their Connected Account correctly.
    if (!restaurantId) {
      const error =
        "No restaurant ID field in the restaurant's Connected Account metadata. See Notion 'Restaurant Onboarding Technicals'";

      analytics.track({
        userId: restaurantId,
        event: `Restauraut onboard webhook failed`,
        properties: {
          error,
        },
      });

      response.status(400).json({
        data: null,
        success: false,
        error,
      });

      return;
    }

    const restaurantDataApi = new RestaurantDataApi(
      firebaseAdmin,
      restaurantId,
    );

    await restaurantDataApi.setRestaurantData(RestaurantData.FINANCIAL, {
      stripeConnectedAccount: data,
    });

    stripe;

    response.json({
      data: null,
      error: null,
      success: true,
    });
  },
);
