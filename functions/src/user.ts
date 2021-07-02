import {
  FirestoreCollection,
  IUserMetrics,
  UserData,
  UserDataApi,
} from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { firebaseAdmin } from './admin';

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === 'production'
    ? functions.config().stripe?.secret_live
    : functions.config().stripe?.secret_test;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

/** Manage the creation of a new user */
export const onUserCreated = functions.firestore
  .document(`/${FirestoreCollection.USERS}/{userId}`)
  .onCreate(async (_, context) => {
    const { userId } = context.params;

    const userDataApi = new UserDataApi(firebaseAdmin, userId);
    const userDetails = await userDataApi.getUserData(UserData.DETAILS);

    // //////////////////////////////////////////////////////// //
    // //////////////     Create Stripe customer     ////////// //
    // //////////////////////////////////////////////////////// //
    //  When a user is created, create a Stripe customer object for them.
    // https://stripe.com/docs/payments/save-and-reuse#web-create-customer
    if (userDetails?.email) {
      const customer = await stripe.customers.create({
        email: userDetails?.email,
      });

      const intent = await stripe.setupIntents.create({
        customer: customer.id,
      });

      // Set setup secret etc
      userDataApi.setUserData(UserData.PAYMENT_DETAILS, {
        stripeCustomerId: customer.id,
        stripeSetupSecret: intent.client_secret ?? undefined,
      });
    }

    // //////////////////////////////////////////////////////// //
    // /////////////     Create new user metrics     ////////// //
    // //////////////////////////////////////////////////////// //
    const intialUserMetrics: IUserMetrics = {
      totalBookings: 0,
      totalSpent: { ['GBP']: 0 },
      restaurantsVisited: [],
    };

    await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.USERS)
      .doc(userId)
      .set(
        {
          metrics: intialUserMetrics,
        },
        { merge: true },
      );
  });

/**
 * When a user deletes their account, clean up after them
 */
export const onDeleteUser = functions.auth.user().onDelete(async user => {
  const usersRef = firebaseAdmin
    .firestore()
    .collection(FirestoreCollection.USERS);

  const customer = (await usersRef.doc(user.uid).get()).data();

  if (customer) {
    await stripe.customers.del(customer.customer_id);
  }

  // Delete the customers payments & payment methods in firestore.
  const batch = firebaseAdmin.firestore().batch();
  const paymetsMethodsSnapshot = await usersRef
    .doc(user.uid)
    .collection(FirestoreCollection.ORDERS)
    .get();

  // paymetsMethodsSnapshot.forEach(snap => batch.delete(snap.ref));
  // const paymentsSnapshot = await usersRef
  //   .doc(user.uid)
  //   .collection(FirestoreCollection.ORDERS)
  //   .get();

  // paymentsSnapshot.forEach(snap => batch.delete(snap.ref));
  // await batch.commit();
  // await usersRef.doc(user.uid).delete();

  // Archive Stripe account

  return;
});
