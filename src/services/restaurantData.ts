import { FirestoreCollection, RestaurantData, TRestaurantData } from '..';

// Intended for server-side use ONLY!
export class RestaurantDataApi {
  public restaurantUserId: string | null;
  public admin: any | null;

  constructor(firebaseAdmin: any) {
    this.admin = firebaseAdmin;
    this.restaurantUserId = null;
  }

  // Initialize from backend where we have no access to
  // cookies or other session tokens.
  public async initFromId(restaurantUserId: string) {
    this.restaurantUserId = restaurantUserId;
  }

  // Gets restaurantId from cookie if in SSR mode.
  // Get context from getServerSideProps
  // Cookie token comes from nookies.get(ctx).token
  public async initFromCookieToken(cookieToken: string) {
    try {
      const token = await this.admin.auth().verifyIdToken(cookieToken);

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
        .collection(FirestoreCollection.RESTAURANTS)
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
        .collection(FirestoreCollection.RESTAURANTS)
        .doc(this.restaurantUserId)
        .set(
          {
            [field]: value,
          },
          { merge: true },
        );

      return value;
    } catch (e) {
      return null;
    }
  };
}
