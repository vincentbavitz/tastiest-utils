import { FirestoreCollection, TUserData, UserData } from '..';
import { FunctionsResponse } from '../types';
import { adb, FirebaseAdmin } from '../utils/firebase';

// Intended for server-side use ONLY!
// If you want to use this client-side, use useUserData instead.

export class UserDataApi {
  public userId: string | null;
  public admin: FirebaseAdmin;

  /*
   * Get context from getServerSideProps
   */
  constructor(firebaseAdmin: any, userId?: string) {
    this.admin = firebaseAdmin;
    this.userId = userId ?? null;
  }

  // Gets userId from cookie if in SSR mode.
  // In this case, userId isn't passed in the constructor.
  // Get context from getServerSideProps
  // Cookie token comes from nookies.get(ctx).token
  public async initFromCookieToken(cookieToken: string) {
    try {
      const token = await this.admin.auth().verifyIdToken(cookieToken);

      // User is authenticated!
      this.userId = token.uid;
      return { userId: token.uid, email: token.email };
    } catch (error) {
      return { userId: null, email: null };
    }
  }

  public async initFromEmail(email: string) {
    try {
      const user = await this.admin.auth().getUserByEmail(email);

      if (!user) {
        return null;
      }

      this.userId = user.uid;
      return { userId: user.uid, email: user.email };
    } catch {
      return { userId: null, email: null };
    }
  }

  public getUserData = async <T extends UserData>(
    field: T,
  ): Promise<TUserData<T> | null> => {
    // Ensure we are initialized
    if (!this.userId) {
      throw new Error('UserDataApi: Ensure you have initialized first.');
    }

    try {
      const doc = await adb(this.admin, FirestoreCollection.USERS)
        .doc(this.userId)
        .get();

      const userData = await doc.data();

      return (userData?.[field] as TUserData<T>) ?? null;
    } catch (error) {
      return null;
    }
  };

  public setUserData = async <T extends UserData>(
    field: T,
    value: Partial<TUserData<T>>,
  ): Promise<FunctionsResponse<TUserData<T>>> => {
    // Ensure we are initialized
    if (!this.userId) {
      throw new Error('UserDataApi: Ensure you have initialized first.');
    }

    try {
      await adb(this.admin, FirestoreCollection.USERS)
        .doc(this.userId)
        .set(
          {
            [field]: value,
          },
          { merge: true },
        );

      return { success: true, error: null, data: null };
    } catch (e) {
      return { success: false, error: String(e), data: null };
    }
  };
}
