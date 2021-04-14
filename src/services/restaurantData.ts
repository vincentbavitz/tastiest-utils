import * as firebaseAdmin from 'firebase-admin';
import { GetServerSidePropsContext } from 'next';
import nookies from 'nookies';
import {
  FirebaseAdminCert,
  FirestoreCollection,
  RestaurantData,
  TRestaurantData,
} from '..';

// Intended for server-side use ONLY!
export class RestaurantDataApi {
  public restaurantUserId: string | null;
  public firebaseCert: FirebaseAdminCert | null;
  public admin: any | null;

  constructor(restaurantUserId: string, firebaseCert: FirebaseAdminCert) {
    this.restaurantUserId = restaurantUserId ?? null;
    this.firebaseCert = firebaseCert ?? null;

    if (!restaurantUserId || !firebaseCert) {
      throw new Error('RestaurantDataApi: Failed to initialize');
    }

    this.admin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(firebaseCert),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }

  // Gets restaurantId from cookie if in SSR mode.
  // Get context from getServerSideProps
  public async initFromCtx(ctx: GetServerSidePropsContext) {
    try {
      const cookies = nookies.get(ctx);
      const token = await this.admin.auth().verifyIdToken(cookies.token);

      // User is authenticated!
      this.restaurantUserId = token.uid;
      return { restaurantUserId: token.uid, email: token.email };
    } catch (error) {
      return { restaurantUserId: null, email: null };
    }
  }

  public getRestaurantData = async <T extends RestaurantData>(
    field: T,
  ): Promise<TRestaurantData<T> | null> => {
    // Ensure we are initialized
    if (!this.restaurantUserId) {
      throw new Error('RestaurantDataApi: Ensure you have initialized first.');
    }

    try {
      const doc = await this.admin
        .firestore()
        .collection(FirestoreCollection.RESTAURANT_USERS)
        .doc(this.restaurantUserId)
        .get();

      const restaurantData = await doc.data();

      return (restaurantData?.[field] as TRestaurantData<T>) ?? null;
    } catch (error) {
      return null;
    }
  };

  public setRestaurantData = async <T extends RestaurantData>(
    field: T,
    value: TRestaurantData<T>,
  ) => {
    // Ensure we are initialized
    if (!this.restaurantUserId) {
      throw new Error('RestaurantDataApi: Ensure you have initialized first.');
    }

    try {
      await this.admin
        .firestore()
        .collection(FirestoreCollection.RESTAURANT_USERS)
        .doc(this.restaurantUserId)
        .update({
          [field]: value,
        });

      return value;
    } catch (e) {
      return null;
    }
  };
}
