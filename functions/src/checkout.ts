import {
  FirestoreCollection,
  IBooking,
  IOrder,
  reportInternalError,
  TastiestInternalErrorCode,
  UserData,
  UserDataApi,
} from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import moment from 'moment';
import Stripe from 'stripe';
import { firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Analytics = require('analytics-node');
const analytics = new Analytics(functions.config().segment.write_key);

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? functions.config().stripe?.secret_live
    : functions.config().stripe?.secret_test;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

/**
 * When adding the payment method ID on the client,
 * this function is triggered to retrieve the payment method details.
 */
export const addPaymentMethodDetails = functions.firestore // .region(FIREBASE.DEFAULT_REGION)
  .document(
    `/${FirestoreCollection.USERS}/{userId}/${UserData.PAYMENT_METHODS}/{pushId}`,
  )
  .onCreate(async (snap, context) => {
    try {
      const paymentMethodId = snap.data().id;
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentMethodId,
      );

      await snap.ref.set(paymentMethod);

      // Create a new SetupIntent so the customer can add a new method next time.
      const intent = await stripe.setupIntents.create({
        customer: `${paymentMethod.customer}`,
      });

      await snap?.ref?.parent?.parent?.set(
        {
          setup_secret: intent.client_secret,
        },
        { merge: true },
      );

      return;
    } catch (error) {
      await snap.ref.set({ error: String(error) }, { merge: true });
      await reportError(error, context.params.userId);
    }
  });

/** On payment success */
export const onPaymentSuccess = functions.firestore
  .document(`/${FirestoreCollection.ORDERS}/{orderId}`)
  .onUpdate(async snap => {
    const before = snap.before.data() as IOrder;
    const after = snap.after.data() as IOrder;

    // Payment Success
    if (!before.paidAt && typeof after.paidAt === 'number') {
      const userDataApi = new UserDataApi(firebaseAdmin, after.userId);
      const userDetails = await userDataApi.getUserData(UserData.DETAILS);

      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          after.paymentMethod as string,
        );

        // Get corresponding booking
        const bookingRef = await firebaseAdmin
          .firestore()
          .collection(FirestoreCollection.BOOKINGS)
          .doc(after.id)
          .get();

        const booking = (await bookingRef.data()) as IBooking;

        // Calculate the portions of Tastiest and the restaurant, respectively.
        const tastiestPortion = after.price.final * 0.25; // TODO ---> Account for promo codes!
        const restaurantPortion = after.price.final * 0.75;

        const properties = {
          email: userDetails?.email,
          firstName: userDetails?.firstName,
          paidAtDate: moment(after.paidAt).format('Do MMMM YYYY'),
          paymentCard: paymentMethod.card,
          ...after,
          ...booking,

          user: {
            ...userDetails,
          },

          // Internal measurements
          tastiestPortion,
          restaurantPortion,
        };

        // Internal `Payment Success` event
        await analytics.track({
          event: 'Payment Success',
          userId: after.userId,
          properties,
        });
      } catch (error) {
        let raw;
        try {
          raw = JSON.stringify(error);
        } catch {
          raw = String(error);
        }

        await reportInternalError({
          code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
          message: '`Payment Success` event failed to fire',
          timestamp: Date.now(),
          shouldAlert: true,
          originFile: 'functions/src/checkout.ts',
          properties: { ...after },
          raw,
        });
      }
    }

    return;
  });
