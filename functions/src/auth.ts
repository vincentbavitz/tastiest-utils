import {
  FirestoreCollection,
  UserData,
  UserDataApi,
  UserRole,
} from '@tastiest-io/tastiest-utils';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { stripe } from './checkout';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Analytics = require('analytics-node');
const analytics = new Analytics(functions.config().segment.write_key);

// Sign up user with a given role
// Body must include:
//    role=<UserRole>
//    email=<email>
//    password=<password>
//    firstName=<firstName> <-- optional
export const registerUser = functions.https.onRequest(
  async (request, response) => {
    const role = String(request.body?.role).toLowerCase() as UserRole;
    const email = request.body?.email;
    const password = request.body?.password;

    // Enable cors
    response.set('Access-Control-Allow-Origin', '*');

    if (
      role !== String(UserRole.EATER) &&
      role !== String(UserRole.RESTAURANT) &&
      role !== String(UserRole.ADMIN)
    ) {
      response.send({
        user: null,
        error: 'Invalid user role',
      });
      return;
    }

    if (email.length === 0 || password.length === 0) {
      response.send({ user: null, error: 'No email or no password given' });
      return;
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        emailVerified: false,
        password,
        disabled: false,
      });

      const userDataApi = new UserDataApi(admin, userRecord.uid);
      await userDataApi.setUserData(UserData.ROLE, role);

      // Set firstName if it was given
      const firstName = request.body?.firstName?.split(' ')[0];
      if (firstName && role === UserRole.EATER) {
        await userDataApi.setUserData(UserData.DETAILS, {
          firstName,
          email,
        });
      }

      // Track sign up.
      // 'Identify' step happens client-side to capture user agent
      analytics.track({
        userId: userRecord.uid,
        event: 'User Signed Up',
        properties: {
          traits: {
            role,
            email: userRecord.email,
          },
        },
      });

      //  When a user is created, create a Stripe customer object for them.
      // https://stripe.com/docs/payments/save-and-reuse#web-create-customer
      const customer = await stripe.customers.create({ email });
      const intent = await stripe.setupIntents.create({
        customer: customer.id,
      });

      await admin
        .firestore()
        .collection(FirestoreCollection.STRIPE_CUSTOMERS)
        .doc(userRecord.uid)
        .set({
          customer_id: customer.id,
          setup_secret: intent.client_secret,
        });

      response.send({ user: userRecord, error: null });
    } catch (error) {
      response.send({ user: null, error });
      return;
    }
  },
);
