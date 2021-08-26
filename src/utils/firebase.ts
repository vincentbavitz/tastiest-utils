import admin from 'firebase-admin';
import { FirestoreCollection } from '..';

export type FirebaseAdmin = admin.app.App;

/** Abstract DB shorthand.
 * admin is of the type: `firebase-admin`
 */
const adb = (
  admin: FirebaseAdmin,
  collection: FirestoreCollection,
): FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> =>
  admin.firestore().collection(collection);

export { adb };
