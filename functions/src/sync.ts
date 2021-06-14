import {
  CmsApi,
  FunctionsResponse,
  RestaurantData,
  RestaurantDataApi,
} from '@tastiest-io/tastiest-utils';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// import Stripe from 'stripe';
// eslint-disable-next-line @typescript-eslint/no-var-requires

// Syncs Contentful data to Firestore on publish
// Includes restaurants, deals, etc.
export const syncFromContentful = functions.https.onRequest(
  async (request, response: functions.Response<FunctionsResponse>) => {
    // Our Contentful webhook gives us our entity type (eg, 'restaurant', etc)
    // and an entity ID.
    // Currently (as of 15/04/2021), Contentful Webhooks don't give us linked
    // assets in the response, so we must use these values to lookup the value
    // from their regular API before sending it off to Firestore.
    const cmsApi = new CmsApi(
      functions.config().contentful.space_id,
      functions.config().contentful.access_token,
    );

    const contentType = request.body?.sys?.contentType?.sys?.id;
    const entityId = request.body?.sys?.id;

    if (!entityId || !contentType) {
      response.json({
        data: null,
        success: false,
        error: 'Invalid entityId or contentType',
      });

      return;
    }

    // For each content type, sync to Firestore
    if (contentType !== 'restaurant') {
      return;
    }

    const restaurantId = request.body?.fields?.id?.['en-US'];
    const restaurant = await cmsApi.getRestaurantById(restaurantId);

    if (!restaurant) {
      response.json({
        data: null,
        success: false,
        error: 'No restaurant found',
      });

      return;
    }

    try {
      const restaurantDataApi = new RestaurantDataApi(admin, restaurant.id);

      await restaurantDataApi.setRestaurantData(
        RestaurantData.DETAILS,
        restaurant,
      );

      response.json({
        data: null,
        success: true,
        error: null,
      });
      return;
    } catch (error) {
      response.json({
        success: false,
        data: null,
        error: 'Firebase admin error',
      });
      return;
    }
  },
);
