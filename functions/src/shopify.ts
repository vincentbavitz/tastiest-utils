import { FunctionsResponse } from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import { firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SegmentAnalytics = require('analytics-node');
const analytics: Analytics = new SegmentAnalytics(
  functions.config().segment.write_key,
);

// interface IEventsTransform {
//   shopifyEventName: string;
//   tastiestEventName: string;
// }

/**
 * Syncs Shopify tracking to Firestore using webhooks
 */
export const syncShopifyTracking = functions.https.onRequest(
  async (request: any, response: functions.Response<FunctionsResponse>) => {
    // Get event type. Given the event type, send data to Firestore or otherwise act on the data.
    const body = request.body;

    // No event given
    // if (!body?.event?.length) {
    //   response.send({
    //     success: false,
    //     error: 'No event given',
    //     data: null,
    //   });
    //   return;
    // }

    // const EVENTS_TO_FORWARD: IEventsTransform[] = [
    //   {
    //     shopifyEventName: 'Product Viewed',
    //     tastiestEventName: 'Product Viewed',
    //   },
    //   { shopifyEventName: 'Product Added', tastiestEventName: 'Product Added' },
    // ];

    // Refeed event back into Segment
    // await firebaseAdmin.firestore().collection('tracking').add({ body });

    // Renaming events from LittleData to match the Tastiest schema
    const eventsNameTransform = new Map();
    eventsNameTransform.set('Product Viewed', 'Offer Viewed');

    const EVENTS_TO_IGNORE = [
      'Product Removed',
      'Product Added',
      'Order Completed',
    ];

    const anonymousId = body.anonymousId ?? body.userId ?? uuid();

    try {
      // Events
      if (body?.type === 'track') {
        if (EVENTS_TO_IGNORE.some(event => event === body?.event)) {
          response.send({
            success: true,
            error: null,
            data: null,
          });
          return;
        }

        const eventName = eventsNameTransform.has(body?.event)
          ? eventsNameTransform.get(body?.event)
          : body.event;

        analytics.track(
          {
            anonymousId,
            userId: body.userId ?? null,
            context: body.context ?? null,
            event: eventName,
            properties: body.properties,
          },
          () => {
            response.send({
              success: true,
              error: null,
              data: null,
            });
          },
        );

        // window.LittledataLayer.attributes["segment-clientID"]
        return;
      }

      // Page Views
      if (body?.type === 'page') {
        await firebaseAdmin
          .firestore()
          .collection('page')
          .add({ body: JSON.stringify(body) });

        analytics.page(
          {
            anonymousId,
            userId: body.userId ?? null,
            context: body.context ?? null,
            properties: body.properties ?? {},
          },
          () => {
            response.send({
              success: true,
              error: null,
              data: null,
            });
          },
        );
      }

      return;
    } catch (error) {
      const errorMessage = 'Tracking Forwarding Error';

      firebaseAdmin
        .firestore()
        .collection('errors')
        .add({ error: String(error) });

      analytics.track(
        {
          anonymousId,
          context: body.context ?? null,
          event: errorMessage,
          properties: {
            ...body,
            error: String(error),
          },
        },
        () => {
          response.send({
            success: false,
            error: errorMessage,
            data: null,
          });
        },
      );
    }
  },
);

/**
 * Marks orders as paid as soon as they're fulfilled, since they've
 * already paid through Stripe
 */
export const syncPaymentsToShopify = functions.https.onRequest(
  async (request: any, response: functions.Response<FunctionsResponse>) => {
    // Get event type. Given the event type, send data to Firestore or otherwise act on the data.
    const body = request.body;

    const details = body?.data?.object;
    const { billing_details } = details;

    try {
      await firebaseAdmin.firestore().collection('testing').add({ body });
      await firebaseAdmin.firestore().collection('details').add({ details });
    } catch (error) {
      await firebaseAdmin.firestore().collection('errors').add({ error });
    }

    // Values come from the JSON encoded description of the Stripe payment
    let quantity = 0;
    let unitPrice = 0;
    let shopifyProductId = '';
    let anonymousId = '';
    let cartToken = '';

    // 1. I need to slap the anonymousId into the Stripe description from /api/pay
    // 2. Grab the anonymousId from this webhook ^ as with others in description
    // 3. Attach anonymousId to note_attributes for the order

    try {
      const description = JSON.parse(details.description);

      // Grab information from Stripe payment
      shopifyProductId = description?.shopifyProductId;
      anonymousId = description?.anonymousId;
      unitPrice = description?.unitPrice;
      cartToken = description?.cartToken;
      quantity = description?.quantity;

      if (!shopifyProductId?.length || !unitPrice || !quantity) {
        await firebaseAdmin
          .firestore()
          .collection('errors')
          .add({ line: 146, body });

        response.status(406).json({
          success: false,
          data: null,
          error:
            'Invalid order description. Must include valid JSON with the key-value pair of shopifyProductId, unitPrice and quantity',
        });

        return;
      }
    } catch (e) {
      response.status(406).json({
        success: false,
        data: null,
        error: 'Invalid JSON in order description.',
      });

      return;
    }

    // Actual amount is 1.33 * unitPrice since Stripe send us Tastiest's 75% cut.
    // const amount = (unitPrice * 1.333333).toFixed(2);

    const email =
      '_' + billing_details.email ?? billing_details?.receipt_email ?? '';
    const phone = billing_details?.address?.phone ?? null;
    const zip = billing_details?.address?.postal_code ?? null;

    const STRIPE_SECRET_KEY =
      process.env.NODE_ENV === 'production'
        ? functions.config().stripe?.secret_test
        : functions.config().stripe?.secret_live;

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2020-08-27',
    });

    const customer = await stripe.customers.retrieve(
      body?.data?.object?.customer,
    );

    if (customer) {
      await firebaseAdmin.firestore().collection('customer').add({ customer });
    }

    const order = {
      email,
      financial_status: 'paid',
      currency: 'GBP',
      fulfillment_status: 'fulfilled',
      send_receipt: false,
      send_fulfillment_receipt: false,
      inventory_behaviour: 'bypass',
      cart_token: cartToken,
      transactions: [
        {
          amount: unitPrice.toFixed(2),
          kind: 'authorization',
          status: 'success',
        },
      ],
      billing_address: {
        name: billing_details?.name ?? null,
        city: billing_details?.address?.city ?? null,
        zip,
        phone,
      },
      customer: {
        // id: body?.data?.object?.customer ?? null,
        first_name: billing_details?.name?.split(' ')?.[0] ?? '',
        last_name: billing_details?.name?.split(' ')?.[1] ?? '',
        email,
        phone,
      },
      line_items: [
        {
          variant_id: shopifyProductId,
          quantity: String(Number(Math.round(quantity))),
        },
      ],
      note_attributes: [{ ['segment-clientID']: anonymousId }],
      tags: 'Imported from Stripe',
    };

    await firebaseAdmin.firestore().collection('orderorder').add({ order });

    try {
      const result = await fetch(
        'https://tastiestio.myshopify.com/admin/api/2021-04/orders.json',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': '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',
          },
          body: JSON.stringify({
            order,
          }),
        },
      );

      // Sync to Littledata
      await fetch('https://transactions.littledata.io/clientID', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientID: anonymousId,
          cartID: cartToken,
        }),
      });

      const data = await result.json();

      response.json({ success: true, data, error: null });
      return;
    } catch (error) {
      response.json({ success: false, data: null, error: String(error) });
    }
  },
);
