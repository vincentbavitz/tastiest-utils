import { FunctionsResponse } from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';
import { firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SegmentAnalytics = require('analytics-node');
const analytics: Analytics = new SegmentAnalytics(
  functions.config().segment.write_key,
);

interface IEventsTransform {
  shopifyEventName: string;
  tastiestEventName: string;
}

/**
 * Syncs Shopify tracking to Firestore using webhooks
 */
export const syncShopifyToFirestore = functions.https.onRequest(
  async (request: any, response: functions.Response<FunctionsResponse>) => {
    // Get event type. Given the event type, send data to Firestore or otherwise act on the data.
    const body = request.body;

    // No event given
    if (!body?.event?.length) {
      response.send({
        success: false,
        error: 'No event given',
        data: null,
      });
      return;
    }

    const EVENTS_TO_FORWARD: IEventsTransform[] = [
      {
        shopifyEventName: 'Product Viewed',
        tastiestEventName: 'Product Viewed',
      },
      { shopifyEventName: 'Product Added', tastiestEventName: 'Product Added' },
    ];

    // Refeed event back into Segment

    try {
      // Events
      if (
        EVENTS_TO_FORWARD.some(
          trackingEvent => trackingEvent.shopifyEventName === body?.event,
        )
      ) {
        // const

        analytics.track(
          {
            userId: body.userId ?? null,
            anonymousId: body.anonymousId ?? body.userId ?? uuid(),
            context: body.context ?? null,
            event: EVENTS_TO_FORWARD[body.event].tastiestEventName,
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

        return;
      }

      // Page Views
      if (body?.type === 'page') {
        analytics.page(
          {
            userId: body.userId ?? null,
            anonymousId: body.anonymousId ?? body.userId ?? uuid(),
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

      firebaseAdmin.firestore().collection('errors').add({ error });

      analytics.track(
        {
          anonymousId: uuid(),
          context: body.context ?? null,
          event: errorMessage,
          properties: {
            ...body,
            error,
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

    await firebaseAdmin.firestore().collection('testing').add({ body });

    // Values come from the JSON encoded description of the Stripe payment
    let quantity = 0;
    let unitPrice = 0;
    let shopifyProductId = '';

    try {
      const description = JSON.parse(body?.data?.object?.description);

      shopifyProductId = description?.shopifyProductId;
      unitPrice = description?.unitPrice;
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

    const email =
      body?.data?.object?.email ?? body?.data?.object?.receipt_email ?? '';

    // Actual amount is 1.33 * unitPrice since Stripe send us Tastiest's 75% cut.
    const amount = (unitPrice * 1.333333).toFixed(2);

    try {
      await fetch(
        'https://tastiestio.myshopify.com/admin/api/2021-04/orders.json',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': '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',
          },
          body: JSON.stringify({
            order: {
              email,
              financial_status: 'paid',
              currency: 'GBP',
              fulfillment_status: 'fulfilled',
              send_receipt: false,
              send_fulfillment_receipt: false,
              inventory_behaviour: 'bypass',
              transactions: [
                {
                  amount,
                  kind: 'authorization',
                  status: 'success',
                },
              ],
              line_items: [
                {
                  variant_id: shopifyProductId,
                  quantity: String(Number(Math.round(quantity))),
                },
              ],
              tags: 'Imported from Stripe',
            },
          }),
        },
      );

      response.json({ success: true, data: null, error: null });
      return;
    } catch (error) {
      response.json({ success: false, data: null, error: String(error) });
    }
  },
);
