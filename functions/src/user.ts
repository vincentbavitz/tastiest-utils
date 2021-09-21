import {
  FirestoreCollection,
  IBooking,
  IOrder,
  IUserData,
  IUserMetrics,
  reportInternalError,
  TastiestInternalErrorCode,
  UserData,
  UserDataApi,
} from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { db, firebaseAdmin } from './admin';

/** Manage the creation of a new user */
export const onUserCreated = functions.firestore
  .document(`/${FirestoreCollection.USERS}/{userId}`)
  .onCreate(async (_, context) => {
    const { userId } = context.params;

    const userRecord = await firebaseAdmin.auth().getUser(userId);
    const userDataApi = new UserDataApi(firebaseAdmin, userId);

    const STRIPE_SECRET_KEY = userRecord?.customClaims?.isTestAccount
      ? functions.config().stripe?.secret_test
      : functions.config().stripe?.secret_live;

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2020-08-27',
    });

    // const userDetails = await userDataApi.getUserField(UserData.DETAILS);

    // //////////////////////////////////////////////////////// //
    // //////////////     Create Stripe customer     ////////// //
    // //////////////////////////////////////////////////////// //
    //  When a user is created, create a Stripe customer object for them.
    // https://stripe.com/docs/payments/save-and-reuse#web-create-customer
    try {
      const customer = await stripe.customers.create({
        email: userRecord.email,
      });

      const intent = await stripe.setupIntents.create({
        customer: customer.id,
      });

      // Set setup secret etc
      userDataApi.setUserData(UserData.PAYMENT_DETAILS, {
        stripeCustomerId: customer.id,
        stripeSetupSecret: intent.client_secret ?? undefined,
      });
    } catch (error) {
      // Report setup intent failure
      await reportInternalError({
        code: TastiestInternalErrorCode.STRIPE_SETUP_INTENT,
        message: 'Failed to add payment method details to Firestore',
        timestamp: Date.now(),
        shouldAlert: true,
        originFile: 'functions/src/user.ts:onUserCreated',
        severity: 'HIGH',
        properties: { userId: context.params.userId, ...userRecord },
        raw: String(error),
      });
    }

    // //////////////////////////////////////////////////////// //
    // /////////////     Create new user metrics     ////////// //
    // //////////////////////////////////////////////////////// //
    const initialUserMetrics: IUserMetrics = {
      totalBookings: 0,
      totalSpent: { ['GBP']: 0 },
      restaurantsVisited: [],
      restaurantsFollowed: [],
    };

    await db(FirestoreCollection.USERS)
      .doc(userId)
      .set(
        {
          details: {
            email: userRecord.email,
          },
          metrics: initialUserMetrics,
        },
        { merge: true },
      );
  });

/**
 * When a user deletes their account, clean up after them
 */
export const onDeleteUser = functions.auth.user().onDelete(async userRecord => {
  const userSnapshot = await db(FirestoreCollection.USERS)
    .doc(userRecord.uid)
    .get();

  const userDataFull = userSnapshot.data() as Partial<IUserData>;

  // //////////////////////////////////////////////////////////// //
  // //         Delete the customer's Stripe account.          // //
  // //////////////////////////////////////////////////////////// //
  const STRIPE_SECRET_KEY = userRecord?.customClaims?.isTestAccount
    ? functions.config().stripe?.secret_test
    : functions.config().stripe?.secret_live;

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2020-08-27',
  });

  try {
    if (userDataFull?.paymentDetails?.stripeCustomerId) {
      stripe.customers.del(userDataFull?.paymentDetails?.stripeCustomerId);
    }
  } catch (error) {
    await reportInternalError({
      code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
      message: "Failed to delete user's Stripe account",
      properties: {
        ...userRecord.toJSON(),
      },
      originFile: 'functions/src/user.ts:onDelete',
      severity: 'HIGH',
      timestamp: Date.now(),
      shouldAlert: false,
      raw: String(error),
    });
  }

  // //////////////////////////////////////////////////////////// //
  // //            Archive orders from this user.              // //
  // //////////////////////////////////////////////////////////// //
  try {
    const batch = firebaseAdmin.firestore().batch();
    const userOrdersSnapshotDocs = await db(FirestoreCollection.ORDERS)
      .where('userId', '==', userRecord.uid)
      .get();

    // Add user's orders to archive collection
    if (!userOrdersSnapshotDocs.empty) {
      userOrdersSnapshotDocs.docs.forEach(orderSnapshot => {
        const order = orderSnapshot.data() as IOrder;
        const orderRef = db(FirestoreCollection.ORDERS_ARCHIVE).doc(order.id);

        batch.set(orderRef, order);
      });

      await batch.commit();

      // Remove user's orders from original orders collection
      userOrdersSnapshotDocs.docs.forEach(orderSnapshot => {
        const order = orderSnapshot.data() as IOrder;
        const orderRef = db(FirestoreCollection.ORDERS).doc(order.id);

        batch.delete(orderRef);
      });
    }
    await batch.commit();
  } catch (error) {
    await reportInternalError({
      code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
      message: "Failed to archive user's orders",
      timestamp: Date.now(),
      originFile: 'functions/src/user.ts:onDelete',
      severity: 'HIGH',
      properties: {
        ...userRecord.toJSON(),
      },
      shouldAlert: false,
      raw: String(error),
    });
  }

  // //////////////////////////////////////////////////////////// //
  // //            Archive bookings from this user.            // //
  // //////////////////////////////////////////////////////////// //
  try {
    const batch = firebaseAdmin.firestore().batch();
    const userBookingsSnapshotDocs = await db(FirestoreCollection.BOOKINGS)
      .where('userId', '==', userRecord.uid)
      .get();

    // Add user's bookings to archive collection
    if (!userBookingsSnapshotDocs.empty) {
      userBookingsSnapshotDocs.docs.forEach(bookingSnapshot => {
        const booking = bookingSnapshot.data() as IBooking;
        const bookingRef = db(FirestoreCollection.BOOKINGS_ARCHIVE).doc(
          booking.orderId,
        );

        batch.set(bookingRef, booking);
      });

      await batch.commit();

      // Remove user's bookings from original bookings collection
      userBookingsSnapshotDocs.docs.forEach(bookingSnapshot => {
        const booking = bookingSnapshot.data() as IBooking;
        const bookingRef = db(FirestoreCollection.BOOKINGS).doc(
          booking.orderId,
        );

        batch.delete(bookingRef);
      });

      await batch.commit();
    }
  } catch (error) {
    await reportInternalError({
      code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
      message: "Failed to archive user's bookings",
      timestamp: Date.now(),
      originFile: 'functions/src/user.ts:onDelete',
      severity: 'HIGH',
      properties: {
        ...userRecord.toJSON(),
      },
      shouldAlert: false,
      raw: String(error),
    });
  }

  // //////////////////////////////////////////////////////////// //
  // //                Archive user from USERS.                // //
  // //////////////////////////////////////////////////////////// //
  try {
    await db(FirestoreCollection.USERS_ARCHIVE).add(userDataFull);
    await db(FirestoreCollection.USERS).doc(userRecord.uid).delete();
  } catch (error) {
    await reportInternalError({
      code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
      message: 'Failed to archive user',
      timestamp: Date.now(),
      originFile: 'functions/src/user.ts:onDelete',
      severity: 'HIGH',
      properties: {
        ...userRecord.toJSON(),
      },
      shouldAlert: false,
      raw: String(error),
    });
  }

  return;
});
