import {
  CmsApi,
  Contact,
  FunctionsResponse,
  RestaurantDataApi,
  RestaurantDataKey,
  RestaurantDetails,
  RestaurantProfile,
} from '@tastiest-io/tastiest-utils';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import lodash from 'lodash';

// import Stripe from 'stripe';
// eslint-disable-next-line @typescript-eslint/no-var-requires

/**
 * Syncs Contentful data to Firestore on publish
 * Includes restaurants, deals, etc.
 */
export const syncFromContentful = functions.https.onRequest(
  async (request, response: functions.Response<FunctionsResponse>) => {
    // Our Contentful webhook gives us our entity type (eg, 'restaurant', etc)
    // and an entity ID.

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
      response.json({
        data: null,
        success: false,
        error: 'Not a restaurant',
      });
      return;
    }

    const restaurantId =
      request.body?.fields?.id?.['en-US'] ?? request.body?.fields?.id;

    const environment =
      request.body?.sys?.environment?.sys?.id === 'development'
        ? 'development'
        : 'production';

    // Currently (as of 15/04/2021), Contentful Webhooks don't give us linked
    // assets in the response, so we must use these values to lookup the value
    // from their regular API before sending it off to Firestore.
    const cmsApi = new CmsApi(
      functions.config().contentful.space_id,
      functions.config().contentful.access_token,
      environment,
    );

    const restaurant = await cmsApi.getRestaurantById(restaurantId);

    if (!restaurant) {
      response.json({
        data: null,
        success: false,
        error: `No restaurant found with ID ${restaurantId}. Environment: ${environment}.`,
      });

      return;
    }

    // Get the contact, as the cms API omits it for security.
    const contactEntryId = request.body?.fields?.contact?.['en-US']?.sys?.id;
    const contactEntry = await cmsApi.client.getEntry<Contact>(contactEntryId);
    const contact = contactEntry.fields;

    const restaurantDetails: Omit<RestaurantDetails, 'mode' | 'isArchived'> = {
      id: restaurant.id,
      name: restaurant.name,
      city: restaurant.city,
      cuisine: restaurant.cuisine,
      location: restaurant.location,
      bookingSystem: restaurant.bookingSystem,
      businessType: restaurant.businessType,
      uriName: restaurant.id,
      contact,
    };

    const restaurantProfile: RestaurantProfile = {
      website: restaurant.website,
      profilePicture: restaurant.profilePicture,
      backdropVideo: restaurant.backdropVideo,
      backdropStillFrame: restaurant.backdropStillFrame,
      heroIllustration: restaurant.heroIllustration,
      description: restaurant.description,
      publicPhoneNumber: restaurant.publicPhoneNumber,
      meta: restaurant.meta,
    };

    try {
      const restaurantDataApi = new RestaurantDataApi(admin, restaurant.id);

      const detailsResponse = await restaurantDataApi.setRestaurantData(
        RestaurantDataKey.DETAILS,
        lodash.pickBy(
          restaurantDetails,
          (_, value) => !lodash.isUndefined(value),
        ),
      );

      const profileResponse = await restaurantDataApi.setRestaurantData(
        RestaurantDataKey.PROFILE,
        lodash.pickBy(
          restaurantProfile,
          (_, value) => !lodash.isUndefined(value),
        ),
      );

      response.json({
        data: {
          detailsResponse,
          profileResponse,
          restaurant,
          restaurantDetails,
          restaurantProfile,
          restaurantDetailsCleaned: lodash.pickBy(
            restaurantDetails,
            (_, value) => !lodash.isUndefined(value),
          ),
          restaurantProfileCleaned: lodash.pickBy(
            restaurantProfile,
            (_, value) => !lodash.isUndefined(value),
          ),
        },
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
