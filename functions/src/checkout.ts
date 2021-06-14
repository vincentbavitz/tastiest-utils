import { FirestoreCollection, UserData } from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Analytics = require('analytics-node');
const analytics = new Analytics(functions.config().segment.write_key);

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? functions.config().stripe?.secret_test
    : functions.config().stripe?.secret_live;

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
      await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
      await reportError(error, context.params.userId);
    }
  });

// GETs the orders of a restaurant
// Use the parameter ?restaurauntId=<restaurauntId> in your request
// Use case: get initial data server-side ISR and revalidate with SWR.
// export const getOrdersOfRestaurant = functions
//   .region(FIREBASE.DEFAULT_REGION)
//   .https.onRequest(async (request, response) => {
//     const restaurantId = request.query?.restaurantId;

//     if (!restaurantId) {
//       const responseBody: IFunctionsResponseGET = {
//         success: false,
//         error:
//           'No restaurant ID given. Please pass in a restaurantId query parameter.',
//         data: null,
//       };

//       response.send(responseBody);
//       return;
//     }

//     // Restaurant ID was given; get orders
//     // We don't use this in restaurantDataApi because we want it to be
//     // available clientside as well.
//     const snapshot = await admin
//       .firestore()
//       .collection(FirestoreCollection.ORDERS)
//       .get();

//     // Get orders of this particular restaurant
//     const allOrders = snapshot.docs
//       .map(doc => doc.data())
//       .filter(order => order?.deal?.restaurant?.id === restaurantId);

//     const responseBody: IFunctionsResponseGET = {
//       success: true,
//       error: null,
//       data: allOrders,
//     };

//     response.send(responseBody);
//     return;
//   });

//   export const createOrderFromOrderRequest = async (
//     orderId: string,
//   ): Promise<IOrder | null> => {
//     try {
//       const doc = await admin
//         .firestore()
//         .collection(FirestoreCollection.ORDER_REQUESTS)
//         .doc(orderId)
//         .get();

//       const orderRequest = (await doc.data()) as Partial<IOrderRequest>;

//       // Get user ID. User MUST be logged in.
//       const userDataApi = new UserDataApi(admin, orderRequest?.userId);

//       // Ensure all the types and values from Firebase are valid in the order request
//       const orderRequestHeadsValid =
//         orderRequest?.heads >= 1 && orderRequest.heads < 100;
//       const orderRequestSlugIsValid = orderRequest?.fromSlug?.length > 1;
//       const orderRequestExpired =
//         Date.now() >
//         orderRequest?.timestamp + FIREBASE.ORDER_REQUEST_MAX_AGE_MS;

//       // TODO - Make descriptive errors;
//       if (
//         orderRequestExpired ||
//         !orderRequestHeadsValid ||
//         !orderRequestSlugIsValid
//       ) {
//         dlog('exited early, wrong details');
//         return null;
//       }

//       // Get deal and restaurant from Contentful
//       // If deal does not exist on Contentful, there was a clientside mismatch.
//       // This could be an innocent error, or the user is sending nefarious requests.
//       const cms = new CmsApi();
//       const deal = await cms.getDeal(orderRequest.dealId ?? '');

//       if (!deal) {
//         dlog('exited early, no deal');
//         return null;
//       }

//       const order: IOrder = {
//         id: orderId,
//         deal,
//         userId,
//         heads: orderRequest.heads,
//         fromSlug: orderRequest.fromSlug,
//         totalPrice: deal.pricePerHeadGBP * orderRequest.heads,
//         discount: null,
//         // TODO - paidAt should be updated with Firebase functions
//         paidAt: null,
//         orderedAt: Date.now(),
//         abandonedAt: null,
//         paymentDetails: null,
//         refund: null,
//       };

//       // Track the order creation Server Side
//       const analytics = new Analytics(
//         process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY,
//       );

//       analytics.track({
//         userId,
//         anonymousId: userId ? null : uuid(),
//         event: 'Order Created',
//         properties: {
//           ...order,
//         },
//       });

//       // NOW set Firebase order given that we've validated everything server side.
//       await firebaseAdmin
//         .firestore()
//         .collection(FirestoreCollection.ORDERS)
//         .doc(order.id)
//         .set(order);

//       dlog('checkout ➡️         order:', order);

//       return order;
//     } catch (error) {
//       dlog('checkout ➡️ error:', error);
//       return null;
//     }
//   };
// }

function reportError(error: any, userId: string) {
  // This is the name of the StackDriver log stream that will receive the log
  // entry. This name can be any valid log stream name, but must contain "err"
  // in order for the error to be picked up by StackDriver Error Reporting.

  analytics.track({
    userId: userId ?? null,
    event: `Payment Error for user ${userId}`,
    properties: {
      userId,
      message: error?.stack,
    },
  });
}

/**
 * Sanitize the error message for the user.
 */
function userFacingMessage(error: any) {
  return error?.type
    ? error?.message
    : 'An error occurred, developers have been alerted';
}
