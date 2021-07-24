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
import { db, firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AnalyticsNode = require('analytics-node');
const analytics: Analytics = new AnalyticsNode(
  functions.config().segment.write_key,
);

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
      const orderRef = await db(FirestoreCollection.ORDERS).doc(orderId).get();

      // Get the information for the `Payment Success` event properties
      const order = orderRef.data() as IOrder;

      // Couldn't find order
      if (!order?.userId) {
        await reportInternalError({
          code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
          message:
            '`Payment Success` event failed to fire. Could not find the corresponding order.',
          timestamp: Date.now(),
          shouldAlert: true,
          originFile: 'functions/src/checkout.ts:onPaymentSuccessWebhook',
          severity: 'CRITICAL',
          properties: { ...order },
        });

        response.json({
          success: false,
          data: null,
          error: 'Could not find the corresponding order.',
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
          severity: 'CRITICAL',
          properties: { ...order },
        });

        response.json({
          success: false,
          data: null,
          error: 'Could not find the corresponding user.',
        });
        return;
      }

      // Get the corresponding booking
      const bookingSnapshot = await db(FirestoreCollection.BOOKINGS)
        .doc(orderId)
        .get();

      const booking = bookingSnapshot.data() as IBooking;

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

      // Update order payment card
      await db(FirestoreCollection.ORDERS).doc(orderId).set(
        {
          paymentCard,
        },
        { merge: true },
      );

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
        severity: 'CRITICAL',
        properties: { ...request.body },
        raw: String(error),
      });

      response.json({ success: false, data: null, error: String(error) });
    }
  },
);
