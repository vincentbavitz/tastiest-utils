import { UserData, UserDataApi, UserRole } from '@tastiest-io/tastiest-utils';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Analytics = require('analytics-node');
const analytics = new Analytics(functions.config().segment.write_key);

export const userSignedUp = functions.auth.user().onCreate(async user => {
  // Verify user has opened email with /preferences?utm_source
  analytics.track({
    userId: user.uid,
    event: 'User Signed Up',
    properties: {
      traits: {
        email: user.email,
      },
    },
  });
});

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

    if (
      role !== String(UserRole.EATER) &&
      role !== String(UserRole.RESTAURANT) &&
      role !== String(UserRole.ADMIN)
    ) {
      response.send({
        success: false,
        error: 'Invalid user role',
      });
      return;
    }

    if (email.length === 0 || password.length === 0) {
      response.send({ success: false, error: 'No email or no password given' });
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
        await userDataApi.setUserData(UserData.DETAILS, { firstName });
      }

      response.send({ success: true, error: userRecord });
    } catch (error) {
      response.send({ success: false, error });
      return;
    }
    //   if (!entityId || !contentType) {
    //     response.send(
    //       JSON.stringify({
    //         success: false,
    //         error: 'Invalid entityId or contentType',
    //       }),
    //     );
    //     return;
    //   }
  },
);
