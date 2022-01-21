import {
  Booking,
  FirestoreCollection,
  Order,
} from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import { db, firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const analytics = new Analytics(functions.config().segment.write_key);

/** Booking created - sync user metrics */
export const onBookingCreated = functions.firestore
  .document(`/${FirestoreCollection.BOOKINGS}/{orderId}`)
  .onCreate(async snap => {
    const booking = snap.data() as Booking;

    // Get corresponding order
    const orderRef = await db(FirestoreCollection.ORDERS)
      .doc(booking.orderId)
      .get();

    const order = orderRef.data() as Order;

    const userMetricsRef = db(FirestoreCollection.USERS).doc(
      `${booking.userId}`,
    );

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
