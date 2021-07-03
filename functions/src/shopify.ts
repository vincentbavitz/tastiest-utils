import { FunctionsResponse } from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import { v4 as uuid } from 'uuid';
import { firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const analytics = new Analytics(functions.config().segment.write_key);

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

        const eventName = body?.event;

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
    } catch (error) {}
  },
);
