import { FirestoreCollection } from '..';

/** Abstract DB shorthand.
 * admin is of the type: `firebase-admin`
 */
const adb = (admin: any, collection: FirestoreCollection) =>
  admin.firestore().collection(collection);

export { adb };
