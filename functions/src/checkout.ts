import {
    CmsApi,
    dlog,
    FirestoreCollection,
    IOrder,
    IOrderRequest, UserDataApi
} from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

// const STRIPE_SECRET_KEY =
//   process.env.NODE_ENV === 'development'
//     ? functions.config().stripe?.secret_test
//     : functions.config().stripe?.secret_live;

// const stripe = new Stripe(STRIPE_SECRET_KEY, {
//   apiVersion: '2020-08-27',
// });


  export const  getOrderFromOrderRequest = async (
    orderId: string,
  ): Promise<IOrder | null> => {
    try {
      const doc = await admin
        .firestore()
        .collection(FirestoreCollection.ORDER_REQUESTS)
        .doc(orderId)
        .get();

      const orderRequest = (await doc.data()) as Partial<IOrderRequest>;

      // Get user ID. User MUST be logged in.
      const userDataApi = new UserDataApi(admin, orderRequest?.userId);

      // Ensure all the types and values from Firebase are valid in the order request
      const orderRequestHeadsValid =
        orderRequest?.heads >= 1 && orderRequest.heads < 100;
      const orderRequestSlugIsValid = orderRequest?.fromSlug?.length > 1;
      const orderRequestExpired =
        Date.now() >
        orderRequest?.timestamp + FIREBASE.ORDER_REQUEST_MAX_AGE_MS;

      // TODO - Make descriptive errors;
      if (
        orderRequestExpired ||
        !orderRequestHeadsValid ||
        !orderRequestSlugIsValid
      ) {
        dlog('exited early, wrong details');
        return null;
      }

      // Get deal and restaurant from Contentful
      // If deal does not exist on Contentful, there was a clientside mismatch.
      // This could be an innocent error, or the user is sending nefarious requests.
      const cms = new CmsApi();
      const deal = await cms.getDeal(orderRequest.dealId ?? '');

      if (!deal) {
        dlog('exited early, no deal');
        return null;
      }

      const order: IOrder = {
        id: orderId,
        deal,
        userId,
        heads: orderRequest.heads,
        fromSlug: orderRequest.fromSlug,
        totalPrice: deal.pricePerHeadGBP * orderRequest.heads,
        discount: null,
        // TODO - paidAt should be updated with Firebase functions
        paidAt: null,
        orderedAt: Date.now(),
        abandonedAt: null,
        paymentDetails: null,
        refund: null,
      };

      // Track the order creation Server Side
      const analytics = new Analytics(
        process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY,
      );

      analytics.track({
        userId,
        anonymousId: userId ? null : uuid(),
        event: 'Order Created',
        properties: {
          ...order,
        },
      });

      // NOW set Firebase order given that we've validated everything server side.
      await firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.ORDERS)
        .doc(order.id)
        .set(order);

      dlog('checkout ➡️         order:', order);

      return order;
    } catch (error) {
      dlog('checkout ➡️ error:', error);
      return null;
    }
  };
}
