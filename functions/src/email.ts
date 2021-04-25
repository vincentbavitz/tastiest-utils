import {
  FirestoreCollection,
  RestaurantData,
  RestaurantDataApi,
  UserRole,
} from '@tastiest-io/tastiest-utils';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

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
    // (as apposed to `eater`, `admin`).
    admin.auth().setCustomUserClaims(restaurantId, {
      [UserRole.RESTAURANT]: true,
    });
  });
