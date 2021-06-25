import { FirestoreCollection, IBooking } from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as functions from 'firebase-functions';
import { firebaseAdmin } from './admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const analytics = new Analytics(functions.config().segment.write_key);

/** Events and management when a booking is updated */
export const onBookingUpdated = functions.firestore
  .document(`/${FirestoreCollection.BOOKINGS}/{orderId}`)
  .onUpdate(async snap => {
    // const orderId = context.params.orderId;

    const before = snap.before.data() as IBooking;
    const after = snap.after.data() as IBooking;

    await firebaseAdmin.firestore().collection('qwer').add({ before, after });

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
