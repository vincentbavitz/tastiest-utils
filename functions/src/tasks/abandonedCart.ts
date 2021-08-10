import {
  FirestoreCollection,
  IOrder,
  reportInternalError,
  TastiestInternalErrorCode,
} from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import { GoogleCloudTaskQueue } from '.';
import { DEFAULT_REGION } from '..';
import { db, firebaseAdmin } from '../admin';

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
 * If `paidAt` is nullish after ABANDONED_CART_EXPIRY_SECONDS for the order,
 * we'll trigger Segment's Abandoned Cart event to send them an email.
 */
export const onCheckoutInitiated = functions.firestore
  .document(`/${FirestoreCollection.ORDERS}/{orderId}`)
  .onCreate(async snapshot => {
    const data = snapshot.data() as IOrder;
    const { id: orderId } = data;

    // Get the project ID from the FIREBASE_CONFIG env var
    const project = JSON.parse(process.env.FIREBASE_CONFIG as string).projectId;
    const queue = GoogleCloudTaskQueue.ORDER;

    const tasksClient = new CloudTasksClient();
    const queuePath: string = tasksClient.queuePath(
      project,
      DEFAULT_REGION,
      queue,
    );

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
      // scheduleTime: {
      //   seconds: ABANDONED_CART_EXPIRY_SECONDS,
      // },
    };

    try {
      const taskInfo = await tasksClient.createTask({
        parent: queuePath,
        task,
      });

      await firebaseAdmin.firestore().collection('task-test').add({
        taskInfo,
      });
    } catch (error) {
      await reportInternalError({
        code: TastiestInternalErrorCode.CLOUD_TASK,
        message: 'Abandoned Cart task failure',
        properties: {
          orderId,
          raw: String(error),
        },
        originFile: 'functions/src/tasks/abandonedCart.ts:onCheckoutInitiated',
        severity: 'HIGH',
        timestamp: Date.now(),
        shouldAlert: false,
        raw: String(error),
      });
    }
  });

export const abandonedCartCallback = functions.https.onRequest(
  async (req, res) => {
    const payload = req.body as AbandonedCartTaskPayload;

    const snapshot = await db(FirestoreCollection.ORDERS)
      .doc(payload.orderId)
      .get();

    const order = snapshot.data() as IOrder;

    // Order was paid, no worries.
    if (order.paidAt) {
      res.send(200);
      return;
    }

    try {
      // Has the user paid for any orders in the intervening period?
      // Get recent orders from user
      const lastPeriodMs = Date.now() - ABANDONED_CART_EXPIRY_SECONDS * 1000;
      const recentOrdersSnapshot = await db(FirestoreCollection.ORDERS)
        .where('userId', '==', order.userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const recentOrders = recentOrdersSnapshot.docs.map(recentOrder =>
        recentOrder.data(),
      );

      // If they've paid for any order in the intervening period, ignore.
      const hasPaid = recentOrders.some(recentOrder => {
        return recentOrder.paidAt && recentOrder.createdAt > lastPeriodMs;
      });

      if (hasPaid) {
        res.send(200);
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
      await reportInternalError({
        code: TastiestInternalErrorCode.FUNCTIONS_ERROR,
        message: 'Abandoned Cart event failure',
        properties: {
          ...order,
        },
        originFile:
          'functions/src/tasks/abandonedCart.ts:abandonedCartCallback',
        severity: 'HIGH',
        timestamp: Date.now(),
        shouldAlert: false,
        raw: String(error),
      });

      res.status(500).send(error);
    }
  },
);
