import * as firebaseAdmin from 'firebase-admin';

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp();
}

export { firebaseAdmin };
