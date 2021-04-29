import {
  dlog,
  FirestoreCollection,
  RestaurantData,
  RestaurantDataApi,
  UserRole,
} from '@tastiest-io/tastiest-utils';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '.';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Analytics = require('analytics-node');
const analytics = new Analytics(functions.config().segment.write_key);

/**
 * Restaurant onbaording flow.
 */
export const onboardingRestaurant = functions.firestore
  .document(`${FirestoreCollection.RESTAURANTS}/{restaurantId}`)
  .onCreate(async (snap, context) => {
    const { restaurantId } = context.params ?? '';

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

    dlog('email ➡️ snap.data():', snap.data());

    // Create the connected account for the restaurant
    const account = await stripe.accounts.create({
      email: '',
      country: 'gb',
      type: 'custom',
    });

    account.id;
  });
