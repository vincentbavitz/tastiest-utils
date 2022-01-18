import { FirestoreCollection, Order } from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const analytics = new Analytics(functions.config().segment.write_key);

/** Booking created - sync user metrics */
export const onOrderCreated = functions.firestore
  .document(`/${FirestoreCollection.ORDERS}/{orderId}`)
  .onCreate(async snap => {
    const order = snap.data() as Order;

    // Track with Segment following Segment's E-Commerce Spec
    // https://segment.com/docs/connections/spec/ecommerce/v2/#checkout-started

    // Use anonymousId for Pixel deduplication
    await analytics.track({
      event: 'Checkout Started',
      userId: order.userId,
      context: {
        // userAgent,
        page: {
          url: order.fromSlug,
        },
      },
      properties: {
        ...order,

        // Segment E-Commerce Spec
        order_id: order.id,
        affiliation: '',
        value: order.deal.pricePerHeadGBP,
        shipping: 0,
        tax: 0,
        discount: 0,
        coupon: order.promoCode,
        currency: order.price.currency,
        products: [
          {
            product_id: order.deal.id,
            sku: order.deal.id,
            name: order.deal.name,
            price: order.deal.pricePerHeadGBP,
            quantity: order.heads,
            category: '',
            url: `https://tastiest.io/r?offer=${order.deal.id}`,
            image_url: order.deal.image.url,
          },
        ],
        traits: {
          address: {
            city: 'London',
          },
        },
      },
    });

    return;
  });
