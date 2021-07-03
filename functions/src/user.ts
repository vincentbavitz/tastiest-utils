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
import { firebaseAdmin } from './admin';

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

    // const userDetails = await userDataApi.getUserData(UserData.DETAILS);

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
        properties: { userId: context.params.userId, ...userRecord },
        raw: String(error),
      });
    }

    // //////////////////////////////////////////////////////// //
    // /////////////     Create new user metrics     ////////// //
    // //////////////////////////////////////////////////////// //
    const intialUserMetrics: IUserMetrics = {
      totalBookings: 0,
      totalSpent: { ['GBP']: 0 },
      restaurantsVisited: [],
    };

    await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.USERS)
      .doc(userId)
      .set(
        {
          details: {
            email: userRecord.email,
          },
          metrics: intialUserMetrics,
        },
        { merge: true },
      );
  });

/**
 * When a user deletes their account, clean up after them
 */
export const onDeleteUser = functions.auth.user().onDelete(async userRecord => {
  const userSnapshot = await firebaseAdmin
    .firestore()
    .collection(FirestoreCollection.USERS)
    .doc(userRecord.uid)
    .get();

  const userDataFull = userSnapshot.data() as Partial<IUserData>;

  try {
    // //////////////////////////////////////////////////////////// //
    // //         Delete the customer's Stripe account.          // //
    // //////////////////////////////////////////////////////////// //
    const STRIPE_SECRET_KEY = userRecord?.customClaims?.isTestAccount
      ? functions.config().stripe?.secret_test
      : functions.config().stripe?.secret_live;

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2020-08-27',
    });

    if (userDataFull?.paymentDetails?.stripeCustomerId) {
      stripe.customers.del(userDataFull?.paymentDetails?.stripeCustomerId);
    }

    // //////////////////////////////////////////////////////////// //
    // //            Archive orders from this user.              // //
    // //////////////////////////////////////////////////////////// //
    const batch = firebaseAdmin.firestore().batch();
    const userOrdersSnapshotDocs = await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.ORDERS)
      .where('userId', '==', userRecord.uid)
      .get();

    // Add user's orders to archive collection
    userOrdersSnapshotDocs.docs.forEach(orderSnapshot => {
      const order = orderSnapshot.data() as IOrder;
      const orderRef = firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.ORDERS_ARCHIVE)
        .doc(order.id);

      batch.set(orderRef, order);
    });

    await batch.commit();

    // Remove user's orders from original orders collection
    userOrdersSnapshotDocs.docs.forEach(orderSnapshot => {
      const order = orderSnapshot.data() as IOrder;
      const orderRef = firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.ORDERS)
        .doc(order.id);

      batch.delete(orderRef);
    });

    await batch.commit();

    // //////////////////////////////////////////////////////////// //
    // //            Archive bookings from this user.            // //
    // //////////////////////////////////////////////////////////// //
    const userBookingsSnapshotDocs = await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.BOOKINGS)
      .where('userId', '==', userRecord.uid)
      .get();

    // Add user's bookings to archive collection
    userBookingsSnapshotDocs.docs.forEach(bookingSnapshot => {
      const booking = bookingSnapshot.data() as IBooking;
      const bookingRef = firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.BOOKINGS_ARCHIVE)
        .doc(booking.orderId);

      batch.set(bookingRef, booking);
    });

    await batch.commit();

    // Remove user's bookings from original bookings collection
    userBookingsSnapshotDocs.docs.forEach(bookingSnapshot => {
      const booking = bookingSnapshot.data() as IBooking;
      const bookingRef = firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.BOOKINGS)
        .doc(booking.orderId);

      batch.delete(bookingRef);
    });

    await batch.commit();

    // //////////////////////////////////////////////////////////// //
    // //                Archive user from USERS.                // //
    // //////////////////////////////////////////////////////////// //
    await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.USERS_ARCHIVE)
      .add(userDataFull);

    await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.USERS)
      .doc(userRecord.uid)
      .delete();
  } catch (error) {
    await reportInternalError({
      code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
      message: 'User deletion hook function failed.',
      properties: {
        ...userRecord.toJSON(),
      },
      originFile: 'functions/src/user.ts:onDelete',
      timestamp: Date.now(),
      shouldAlert: false,
      raw: String(error),
    });
  }

  return;
});
