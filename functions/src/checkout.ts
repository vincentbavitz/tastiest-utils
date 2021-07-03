import {
  FirestoreCollection,
  FunctionsResponse,
  IBooking,
  IOrder,
  reportInternalError,
  TastiestInternalErrorCode,
  UserData,
  UserDataApi,
} from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import moment from 'moment';
import { firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AnalyticsNode = require('analytics-node');
const analytics: Analytics = new AnalyticsNode(
  functions.config().segment.write_key,
);

// const STRIPE_SECRET_KEY =
//   process.env.NODE_ENV === 'production'
//     ? functions.config().stripe?.secret_live
//     : functions.config().stripe?.secret_test;

// const stripe = new Stripe(STRIPE_SECRET_KEY, {
//   apiVersion: '2020-08-27',
// });

/** On payment success; webhooked to Stripe charge.succeeded */
export const onPaymentSuccessWebhook = functions.https.onRequest(
  async (request: any, response: functions.Response<FunctionsResponse>) => {
    try {
      // Get event type. Given the event type, send data to Firestore or otherwise act on the data.
      const data = request.body.data.object;
      const orderId = data?.metadata?.orderId;
      const paymentCard = {
        brand: data.payment_method_details.card.brand,
        last4: data.payment_method_details.card.last4,
      };

      // Get corresponding order from Firestore
      const orderRef = await firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.ORDERS)
        .doc(orderId)
        .get();

      // Get corresponding booking from Firestore
      const bookingRef = await firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.BOOKINGS)
        .doc(orderId)
        .get();

      // Get the information for the `Payment Success` event properties
      const order = orderRef.data() as IOrder;
      const booking = bookingRef.data() as IBooking;

      // Couldn't find order or booking
      if (!order?.userId || !booking?.userId) {
        await reportInternalError({
          code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
          message:
            '`Payment Success` event failed to fire. Could not find the corresponding order or booking.',
          timestamp: Date.now(),
          shouldAlert: true,
          originFile: 'functions/src/checkout.ts:onPaymentSuccessWebhook',
          properties: { ...order, ...booking },
        });

        response.json({
          success: false,
          data: null,
          error: 'Could not find the corresponding order or booking.',
        });
        return;
      }

      const userDataApi = new UserDataApi(firebaseAdmin, order.userId);
      const userDetails = await userDataApi.getUserData(UserData.DETAILS);

      // User not found
      if (!userDetails) {
        await reportInternalError({
          code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
          message:
            '`Payment Success` event failed to fire. Could not find the corresponding user.',
          timestamp: Date.now(),
          shouldAlert: true,
          originFile: 'functions/src/checkout.ts:onPaymentSuccessWebhook',
          properties: { ...order, ...booking },
        });

        response.json({
          success: false,
          data: null,
          error: 'Could not find the corresponding user.',
        });
        return;
      }

      // Calculate the portions of Tastiest and the restaurant, respectively.
      const tastiestPortion = order.price.final * 0.25; // TODO ---> Account for promo codes!
      const restaurantPortion = order.price.final * 0.75;

      const properties = {
        email: userDetails?.email,
        firstName: userDetails?.firstName,
        paidAtDate: moment(Date.now()).format('Do MMMM YYYY'),
        paymentCard,
        ...order,
        ...booking,

        user: {
          ...userDetails,
        },

        // Internal measurements
        tastiestPortion,
        restaurantPortion,
      };

      await analytics.track({
        event: 'Payment Success',
        userId: order.userId,
        properties,
        timestamp: new Date(),
      });

      // Update chargeId on order in Firestore
      // ch_00000000000000

      // Internal `Payment Success` event

      //   } catch (error) {
      //     let raw;
      //     try {
      //       raw = JSON.stringify(error);
      //     } catch {
      //       raw = String(error);
      //     }

      // }

      response.json({ success: true, data: null, error: null });
    } catch (error) {
      await reportInternalError({
        code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
        message: '`Payment Success` event failed to fire',
        timestamp: Date.now(),
        shouldAlert: true,
        originFile: 'functions/src/checkout.ts:onPaymentSuccessWebhook',
        properties: { ...request.body },
      });

      response.json({ success: false, data: null, error: String(error) });
    }
  },
);
