import {
  FunctionsResponse,
  UserData,
  UserDataApi,
} from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import { firebaseAdmin } from './admin';

// const extractUtms = (url: string) => {
//   return '';
// };

// const MS_IN_DAY = 1000 * 60 * 60 * 24;

/**
 * Tastiest Session Handler
 * Gets the events feed from Segment and stiches together user journeys
 */
export const sessionHandler = functions.https.onRequest(
  async (request: any, response: functions.Response<FunctionsResponse>) => {
    // Get event type. Given the event type, send data to Firestore or otherwise act on the data.
    const body = request.body;

    if (!body?.type) {
      response.json({
        success: false,
        error: 'Invalid event schema',
        data: null,
      });
      return;
    }

    // Update lastActive property on User's profile
    const userId = body?.userId;
    if (userId) {
      const userDataApi = new UserDataApi(firebaseAdmin, userId);

      // Does user even exist?
      const details = await userDataApi.getUserData(UserData.DETAILS);
      if (!details || !details.email) {
        return;
      }

      await userDataApi.setUserData(UserData.DETAILS, {
        lastActive: Date.now(),
      });
    }

    // try {
    //   if (body?.type === 'track') {
    //     // Sync event to current session
    //     const userSessionsDoc = await firebaseAdmin
    //       .firestore()
    //       .collection(FirestoreCollection.SESSIONS)
    //       .doc(body.userId ?? body.anonymousId)
    //       .get();

    //     const userSessions = ((await userSessionsDoc.data()) ??
    //       []) as IUserSession[];

    //     const event: EventTrigger = {
    //       event: body.event ?? '',
    //       context: body.context ?? {},
    //       properties: body.properties ?? {},
    //       timestamp: body.timestamp
    //         ? new Date(body.timestamp).getTime()
    //         : Date.now(),
    //     };

    //     // Get or create current session
    //     let session: IUserSession;
    //     const currentSession: IUserSession | undefined = userSessions.find(
    //       session => session.sessionStartTimestamp > Date.now() - MS_IN_DAY,
    //     );

    //     if (currentSession) {
    //       session = currentSession;
    //       session.eventsTriggered.push(event);
    //     } else {
    //       // TOOD ^ MAKE UTMS AUTO FILL FROM CONTEXT
    //       session = {
    //         userId: body.userId ?? null,
    //         anonymousId: body.anonymousId ?? null,
    //         userAgent: body.context.userAgent ?? null,
    //         device: 'mobile',
    //         sessionStartTimestamp: Date.now(),
    //         sessionEndTimestamp: null,
    //         pagesVisited: [],
    //         sessionUTMs: {
    //           utm_campaign: null,
    //           utm_source: null,
    //           utm_medium: null,
    //           utm_content: null,
    //           utm_term: null,
    //         },
    //         eventsTriggered: [event],
    //       };
    //     }

    //     await firebaseAdmin
    //       .firestore()
    //       .collection(FirestoreCollection.SESSIONS)
    //       .doc(body.userId ?? body.anonymousId)
    //       .set({ [session.sessionStartTimestamp]: session });

    //     response.json({ success: true, error: null, data: session });
    //     return;
    //   }

    //   // Page Views
    //   if (body?.type === 'page') {
    //     null;
    //     // await firebaseAdmin
    //     //   .firestore()
    //     //   .collection('page')
    //     //   .add({ body: JSON.stringify(body) });

    //     // analytics.page(
    //     //   {
    //     //     anonymousId,
    //     //     userId: body.userId ?? null,
    //     //     context: body.context ?? null,
    //     //     properties: body.properties ?? {},
    //     //   },
    //     //   () => {
    //     //     response.send({
    //     //       success: true,
    //     //       error: null,
    //     //       data: null,
    //     //     });
    //     //   },
    //     // );

    //     response.json({ success: true, error: null, data: null });
    //     return;
    //   }

    //   response.json({ success: false, error: 'Invalid body', data: null });
    //   return;
    // } catch (error) {
    //   //   const errorMessage = 'Tracking Forwarding Error';

    //   await firebaseAdmin
    //     .firestore()
    //     .collection('errors')
    //     .add({ error: String(error) });

    //   response.json({ success: false, error, data: null });
    //   return;
    // }
  },
);

/** Merge sessions saved in Firestore to its respective owner's userId */
// const mergeSessions = (
//   originalSessionList: IUserSession[] = [],
//   anonymousSessionList: IUserSession[] = [],
// ) => {
//   // Does a original session already exist within the last 24hrs?
//   const currentOriginalSession = originalSessionList.find(
//     session => session.sessionStartTimestamp > Date.now() - MS_IN_DAY,
//   );

//   const currentAnonymousSession = anonymousSessionList.sort(
//     (a, b) => a.sessionStartTimestamp - b.sessionStartTimestamp,
//   )?.[0];

//   // Sync current sessions
//   if (currentOriginalSession) {
//     currentOriginalSession.anonymousId = currentAnonymousSession?.anonymousId;
//     currentOriginalSession.sessionUTMs = currentAnonymousSession.sessionUTMs;

//     currentOriginalSession.eventsTriggered = [
//       ...currentOriginalSession.eventsTriggered,
//       ...currentAnonymousSession.eventsTriggered,
//     ];

//     currentOriginalSession.pagesVisited = [
//       ...currentOriginalSession.pagesVisited,
//       ...currentAnonymousSession.pagesVisited,
//     ];
//   }

//   return [...originalSessionList, ...anonymousSessionList];
// };
