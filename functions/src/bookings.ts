import {
  FirestoreCollection,
  IBooking,
  IOrder,
} from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import { firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const analytics = new Analytics(functions.config().segment.write_key);

/** Events and management when a booking is updated */
export const onBookingUpdated = functions.firestore
  .document(`/${FirestoreCollection.BOOKINGS}/{orderId}`)
  .onUpdate(async snap => {
    const before = snap.before.data() as IBooking;
    const after = snap.after.data() as IBooking;

    // Eater arrived!
    if (!before.hasArrived && after.hasArrived) {
      await analytics.track({
        userId: after.userId,
        event: 'Eater Arrived',
        timestamp: new Date(),
        properties: after,
      });
    }

    return;
  });

/** Booking created - sync user metrics */
export const onBookingCreated = functions.firestore
  .document(`/${FirestoreCollection.BOOKINGS}/{orderId}`)
  .onCreate(async snap => {
    const booking = snap.data() as IBooking;

    // Get corresponding order
    const orderRef = await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.ORDERS)
      .doc(booking.orderId)
      .get();

    const order = orderRef.data() as IOrder;

    const userMetricsRef = firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.USERS)
      .doc(`${booking.userId}`);

    // Update user metrics
    await userMetricsRef.update({
      metrics: {
        totalBookings: firebaseAdmin.firestore.FieldValue.increment(1),
        totalSpent: {
          [order.price.currency]: firebaseAdmin.firestore.FieldValue.increment(
            order.price.final,
          ),
        },
        restaurantsVisited: firebaseAdmin.firestore.FieldValue.arrayUnion(
          booking.restaurantId,
        ),
      },
    });

    return;
  });
