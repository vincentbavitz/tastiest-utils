import {
  FunctionsResponse,
  UserDataApi,
  UserDataKey,
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
      const { details } = await userDataApi.getUserData();
      if (!details || !details.email) {
        return;
      }

      await userDataApi.setUserData(UserDataKey.DETAILS, {
        lastActive: Date.now(),
      });
    }

    // try {
    //   if (body?.type === 'track') {
    //     // Sync event to current session
    //     const userSessionsDoc = await db(FirestoreCollection.SESSIONS)
    //       .doc(body.userId ?? body.anonymousId)
    //       .get();

    //     const userSessions = ((await userSessionsDoc.data()) ??
    //       []) as UserSession[];

    //     const event: EventTrigger = {
    //       event: body.event ?? '',
    //       context: body.context ?? {},
    //       properties: body.properties ?? {},
    //       timestamp: body.timestamp
    //         ? new Date(body.timestamp).getTime()
    //         : Date.now(),
    //     };

    //     // Get or create current session
    //     let session: UserSession;
    //     const currentSession: UserSession | undefined = userSessions.find(
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

    //     await db(FirestoreCollection.SESSIONS)
    //       .doc(body.userId ?? body.anonymousId)
    //       .set({ [session.sessionStartTimestamp]: session });

    //     response.json({ success: true, error: null, data: session });
    //     return;
    //   }

    //     response.json({ success: true, error: null, data: null });
    //     return;
    //   }

    //   response.json({ success: false, error: 'Invalid body', data: null });
    //   return;
    // } catch (error) {
    //   //   const errorMessage = 'Tracking Forwarding Error';

    //   response.json({ success: false, error, data: null });
    //   return;
    // }
  },
);

/** Merge sessions saved in Firestore to its respective owner's userId */
// const mergeSessions = (
//   originalSessionList: UserSession[] = [],
//   anonymousSessionList: UserSession[] = [],
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
