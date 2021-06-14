import * as functions from 'firebase-functions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors');
const corsHandler = cors({ origin: true });

export type FunctionHandler = (
  req: functions.https.Request,
  res: functions.Response<any>,
) => void | Promise<void>;

export const withMiddleware = (
  handler: FunctionHandler,
  regions = ['europe-west2', 'europe-west3'],
) =>
  functions.region(...regions).https.onRequest((req, res) => {
    return corsHandler(req, res, () => {
      handler(req, res);
    });
  });
