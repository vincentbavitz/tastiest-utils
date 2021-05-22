import { FunctionsResponse } from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SegmentAnalytics = require('analytics-node');
const analytics: Analytics = new SegmentAnalytics(
  functions.config().segment.write_key,
);

/**
 * Syncs Shopify tracking to Firestore using webhooks
 */
export const syncShopifyToFirestore = functions.https.onRequest(
  async (request, response: functions.Response<FunctionsResponse>) => {
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

    // Was it a Payment Success event?
    // PAYMENT SUCCESS LOGIC

    try {
      // Refeed event back into Segment
      analytics.track({
        userId: body.userId ?? null,
        anonymousId: body.anonymousId ?? null,
        event: body.event,
        properties: body.properties,
        timestamp: body.originalTimestamp ?? Date.now(),
      });

      admin.firestore().collection('testing').add(body);

      // DONE DONE DONE DONE
      response.send({
        success: true,
        error: null,
        data: null,
      });

      return;
    } catch (error) {
      response.send({
        success: false,
        error: `Error: ${error}`,
        data: null,
      });
      return;
    }
  },
);
