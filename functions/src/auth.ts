import { UserData, UserDataApi, UserRole } from '@tastiest-io/tastiest-utils';
import cors from 'cors';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Analytics = require('analytics-node');
const analytics = new Analytics(functions.config().segment.write_key);

const corsHandler = cors({ origin: true });

// Sign up user with a given role
// Body must include:
//    role=<UserRole>
//    email=<email>
//    password=<password>
//    firstName=<firstName> <-- optional
export const registerUser = functions.https.onRequest(
  async (request, response) => {
    corsHandler(request, response, async () => {
      const role = String(request.body?.role).toLowerCase() as UserRole;
      const email = request.body?.email;
      const password = request.body?.password;

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

        response.send({ user: userRecord, error: null });
      } catch (error) {
        response.send({ user: null, error });
        return;
      }
    });
  },
);
