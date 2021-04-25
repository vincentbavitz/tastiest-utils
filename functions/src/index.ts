import * as admin from 'firebase-admin';

admin.initializeApp();

export * from './checkout';
export * from './email';
export * from './sync';

/**
 * When a payment document is written on the client,
 * this function is triggered to create the payment in Stripe.
 *
 * @see https://stripe.com/docs/payments/save-and-reuse#web-create-payment-intent-off-session
 */

// [START chargecustomer]

// /**
//  * When 3D Secure is performed, we need to reconfirm the payment
//  * after authentication has been performed.
//  *
//  * @see https://stripe.com/docs/payments/accept-a-payment-synchronously#web-confirm-payment
//  */
// export const confirmStripePayment = functions.firestore
//   .document('stripe_customers/{userId}/payments/{pushId}')
//   .onUpdate(async (change, context) => {
//     context;

//     if (change.after.data().status === 'requires_confirmation') {
//       const payment = await stripe.paymentIntents.confirm(
//         change.after.data().id,
//       );

//       change.after.ref.set(payment);
//     }
//   });

// /**
//  * When a user deletes their account, clean up after them
//  */
// export const cleanupUser = functions.auth.user().onDelete(async user => {
//   const dbRef = admin
//     .firestore()
//     .collection(FirestoreCollection.USERS);
//   const customer = (await dbRef.doc(user.uid).get()).data();

//   if (customer) {
//     await stripe.customers.del(customer.customer_id);
//   }

//   // Delete the customers payments & payment methods in firestore.
//   const batch = admin.firestore().batch();
//   const paymetsMethodsSnapshot = await dbRef
//     .doc(user.uid)
//     .collection(FirestoreCollection.ORDERS)
//     .get();

//   paymetsMethodsSnapshot.forEach(snap => batch.delete(snap.ref));
//   const paymentsSnapshot = await dbRef
//     .doc(user.uid)
//     .collection(FirestoreCollection.ORDERS)
//     .get();
//   paymentsSnapshot.forEach(snap => batch.delete(snap.ref));

//   await batch.commit();

//   await dbRef.doc(user.uid).delete();
//   return;
// });

// /**
//  * To keep on top of errors, we should raise a verbose error report with Stackdriver rather
//  * than simply relying on functions.logger.error. This will calculate users affected + send you email
//  * alerts, if you've opted into receiving them.
//  */

// // [START reporterror]
