import {
  FirestoreCollection,
  FunctionsResponse,
  IRestaurantData,
  RestaurantData,
  TRestaurantData,
} from '..';
import { adb } from '../utils/firebase';

// Intended for server-side use ONLY!
export class RestaurantDataApi {
  public restaurantId: string | null;
  public admin: any | null;

  constructor(firebaseAdmin: any, restaurantId?: string) {
    this.admin = firebaseAdmin;

    // Initialize from backend where we have no access to
    // cookies or other session tokens.
    this.restaurantId = restaurantId ?? null;
  }

  // Gets restaurantId from cookie if in SSR mode.
  // In this case, restaurantId isn't passed in the constructor.
  // Get context from getServerSideProps
  // Cookie token comes from nookies.get(ctx).token
  public async initFromCookieToken(cookieToken: string) {
    try {
      const token = await this.admin.auth().verifyIdToken(cookieToken);

      // User is authenticated!
      this.restaurantId = token.uid;
      return { restaurantId: token.uid, email: token.email };
    } catch (error) {
      return { restaurantId: null, email: null };
    }
  }

  public getRestaurantField = async <T extends RestaurantData>(
    field?: T,
  ): Promise<TRestaurantData<T> | null> => {
    // Ensure we are initialized
    if (!this.restaurantId) {
      throw new Error('RestaurantDataApi: Ensure you have initialized first.');
    }

    if (!field) {
      throw new Error('RestaurantDataApi: No field given.');
    }

    try {
      const doc = await adb(this.admin, FirestoreCollection.RESTAURANTS)
        .doc(this.restaurantId)
        .get();

      const restaurantData = await doc.data();

      return (restaurantData?.[field] as TRestaurantData<T>) ?? null;
    } catch (error) {
      return null;
    }
  };

  public getRestaurantData = async (): Promise<Partial<IRestaurantData> | null> => {
    // Ensure we are initialized
    if (!this.restaurantId) {
      throw new Error('RestaurantDataApi: Ensure you have initialized first.');
    }

    try {
      const doc = await adb(this.admin, FirestoreCollection.RESTAURANTS)
        .doc(this.restaurantId)
        .get();

      const restaurantData = await doc.data();

      return restaurantData ?? null;
    } catch (error) {
      return null;
    }
  };

  public setRestaurantData = async <T extends RestaurantData>(
    field: T,
    value: Partial<TRestaurantData<T>>,
  ): Promise<FunctionsResponse<TRestaurantData<T>>> => {
    // Ensure we are initialized
    if (!this.restaurantId) {
      throw new Error('RestaurantDataApi: Ensure you have initialized first.');
    }

    try {
      await adb(this.admin, FirestoreCollection.RESTAURANTS)
        .doc(this.restaurantId)
        .set(
          {
            [field]: value,
          },
          { merge: true },
        );

      return { success: true, data: null, error: null };
    } catch (e) {
      return { success: false, data: null, error: String(e) };
    }
  };
}
