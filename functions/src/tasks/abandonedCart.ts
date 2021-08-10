import { FirestoreCollection, IOrder } from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import { GoogleCloudTaskQueue } from '.';
import { db } from '../admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CloudTasksClient } = require('@google-cloud/tasks');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const analytics = new Analytics(functions.config().segment.write_key);

interface AbandonedCartTaskPayload {
  orderId: string;
  docPath: string;
}

const ABANDONED_CART_EXPIRY_SECONDS = 5; //60 * 20;

/**
 * Abandoned cart flow.
 * If `paidAt` is nullish after ABANDONED_CART_EXPIRY for the order,
 * we'll trigger Segment's Abandoned Cart event to send them an email.
 */
export const onOrderCreated = functions.firestore
  .document(`/${FirestoreCollection.ORDERS}/{orderId}`)
  .onCreate(async snapshot => {
    const data = snapshot.data() as IOrder;
    const { id: orderId } = data;

    // Get the project ID from the FIREBASE_CONFIG env var
    const project = JSON.parse(process.env.FIREBASE_CONFIG as string).projectId;
    const location = 'us-central1';
    const queue = GoogleCloudTaskQueue.ORDER;

    const tasksClient = new CloudTasksClient();
    const queuePath: string = tasksClient.queuePath(project, location, queue);

    // Testing
    await db(FirestoreCollection.SESSIONS).add({
      project,
      location,
      queue,
      queuePath,
    });

    const url = `https://${location}-${project}.cloudfunctions.net/abandonedCartCallback`;
    const docPath = snapshot.ref.path;

    // Build payload
    const payload: AbandonedCartTaskPayload = { orderId, docPath };

    const task = {
      httpRequest: {
        url,
        httpMethod: 'POST',
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        headers: {
          'Content-Type': 'application/json',
        },
      },
      scheduleTime: {
        seconds: ABANDONED_CART_EXPIRY_SECONDS,
      },
    };

    await tasksClient.createTask({ parent: queuePath, task });
  });

export const abandonedCartCallback = functions.https.onRequest(
  async (req, res) => {
    const payload = req.body as AbandonedCartTaskPayload;

    try {
      const snapshot = await db(FirestoreCollection.ORDERS)
        .doc(payload.orderId)
        .get();

      const order = snapshot.data() as IOrder;

      // Order was paid, no worries.
      if (order.paidAt) {
        return;
      }

      // Has the user paid for any orders in the intervening period?
      // Get recent orders from user
      const lastPeriodMs = Date.now() - ABANDONED_CART_EXPIRY_SECONDS * 1000;
      const recentOrdersSnapshot = await db(FirestoreCollection.ORDERS)
        .where('userId', '==', order.userId)
        .where('createdAt', '>=', lastPeriodMs)
        .get();

      const recentOrders = recentOrdersSnapshot.docs.map(recentOrder =>
        recentOrder.data(),
      );

      // If they've paid for any order in the intervening period, ignore.
      const hasPaid = recentOrders.some(recentOrder => recentOrder.paidAt);
      if (hasPaid) {
        return;
      }

      // They've abandoned card --> fire off Abandoned Cart Event
      await analytics.track({
        userId: order.userId,
        event: 'Abandoned Cart',
        timestamp: new Date(),
        properties: {
          ...order,
        },
      });

      res.send(200);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  },
);
