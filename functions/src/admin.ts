import { FirestoreCollection } from '@tastiest-io/tastiest-utils';
import * as firebaseAdmin from 'firebase-admin';

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp();
}

const db = (collection: FirestoreCollection) =>
  firebaseAdmin.firestore().collection(collection);

export { firebaseAdmin, db };
