import {
  dlog,
  FirestoreCollection,
  FollowedRestaurant,
  FunctionsResponse,
  reportInternalError,
  RestaurantData,
  RestaurantDataApi,
  RestaurantFollower,
  TastiestInternalErrorCode,
  UserData,
  UserDataApi,
  UserRole,
} from '@tastiest-io/tastiest-utils';
import { response } from 'express';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { db, firebaseAdmin } from './admin';

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

    await restaurantDataApi.setRestaurantData(RestaurantData.METRICS, {
      followers: [],
    });

    stripe;

    response.json({
      data: null,
      error: null,
      success: true,
    });
  },
);

export const onUserUpdatedFollowStatus = functions.firestore
  .document(
    `/${FirestoreCollection.USERS}/{userId}/metrics/restaurantsFollowed/{item}`,
  )
  .onUpdate(async (snap, context) => {
    const userId = context.params.userId;
    const followedItem: FollowedRestaurant = context.params.item;

    const before = snap.before.data() as FollowedRestaurant;
    const after = snap.after.data() as FollowedRestaurant;

    const startedFollowing = !before && after;
    const stoppedFollowing = before && !after;
    const notificationsOn =
      before.restaurantId &&
      after.restaurantId &&
      !before.notifications &&
      after.notifications;
    const notificationsOff =
      before.restaurantId &&
      after.restaurantId &&
      before.notifications &&
      !after.notifications;

    const followersDocReference = db(FirestoreCollection.RESTAURANTS).doc(
      `/${followedItem.restaurantId}/metrics/followers`,
    );

    // Initialise values
    const currentFollowersSnapshot = await followersDocReference.get();
    const currentFollowers = currentFollowersSnapshot.data() as RestaurantFollower[];

    const userDataApi = new UserDataApi(userId);
    const userData = await userDataApi.getUserData(UserData.DETAILS);
    const restaurantDataApi = new RestaurantDataApi(
      firebaseAdmin,
      after.restaurantId,
    );

    const restaurant = await restaurantDataApi.getRestaurantData();

    if (startedFollowing) {
      try {
        const followers = currentFollowers.filter(r => r.userId !== userId);
        followers.push({
          userId,
          name: userData?.firstName as string,
          email: userData?.email as string,
          notifications: after.notifications,
          followedAt: Date.now(),
        });

        // Set restaurant followers
        await restaurantDataApi.setRestaurantData(RestaurantData.METRICS, {
          followers,
        });

        response.json({
          success: true,
          data: { message: 'Started following' },
          error: null,
        });
      } catch (error) {
        await reportInternalError({
          code: TastiestInternalErrorCode.FOLLOWING_ERROR,
          message: `Failed to register new follower for ${restaurant?.details?.name}`,
          timestamp: Date.now(),
          shouldAlert: true,
          originFile: 'functions/src/restaurants.ts:onUserUpdatedFollowStatus',
          severity: 'HIGH',
          raw: String(error),
          properties: {
            restaurant,
            followDataBefore: before,
            followDataAfter: after,
          },
        });

        response.json({
          success: true,
          data: null,
          error: 'Failed to register new follower',
        });
      }

      return;
    }

    if (stoppedFollowing) {
      try {
        const followers = currentFollowers.filter(r => r.userId !== userId);
        await restaurantDataApi.setRestaurantData(RestaurantData.METRICS, {
          followers,
        });

        response.json({
          success: true,
          data: { message: 'Stopped following' },
          error: null,
        });
      } catch (error) {
        await reportInternalError({
          code: TastiestInternalErrorCode.FOLLOWING_ERROR,
          message: `Failed to deregister follower for ${restaurant?.details?.name}`,
          timestamp: Date.now(),
          shouldAlert: true,
          originFile: 'functions/src/restaurants.ts:onUserUpdatedFollowStatus',
          severity: 'HIGH',
          raw: String(error),
          properties: {
            restaurant,
            followDataBefore: before,
            followDataAfter: after,
          },
        });

        response.json({
          success: true,
          data: null,
          error: 'Failed to register new follower',
        });
      }

      return;
    }

    if (notificationsOn || notificationsOff) {
      try {
        const followers = currentFollowers.map(r =>
          r.userId === userId
            ? { ...r, notifications: after.notifications }
            : r,
        );

        await restaurantDataApi.setRestaurantData(RestaurantData.METRICS, {
          followers,
        });

        response.json({
          success: true,
          data: {
            message: `Notifications ${after.notifications ? 'on' : 'off'}`,
          },
          error: null,
        });
      } catch (error) {
        await reportInternalError({
          code: TastiestInternalErrorCode.FOLLOWING_ERROR,
          message: `Failed to register notification status ${restaurant?.details?.name}`,
          timestamp: Date.now(),
          shouldAlert: true,
          originFile: 'functions/src/restaurants.ts:onUserUpdatedFollowStatus',
          severity: 'HIGH',
          raw: String(error),
          properties: {
            restaurant,
            followDataBefore: before,
            followDataAfter: after,
          },
        });

        response.json({
          success: true,
          data: null,
          error: 'Failed to register new follower',
        });
      }

      return;
    }
  });
