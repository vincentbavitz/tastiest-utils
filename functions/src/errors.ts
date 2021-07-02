import {
  FirestoreCollection,
  FunctionsResponse,
  TastiestInternalError,
  TastiestInternalErrorCode,
} from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import moment from 'moment';
import nodemailer from 'nodemailer';
import { firebaseAdmin } from './admin';

/**
 * Report an internal error to the Tastiest Admin Panel
 * Required the following parameters in the body in JSON;
 *      `code`: TastiestInternalErrorCode;
 *      `message`: string         | the message as seen in the Tastiest Admin Panel
 *      `timestamp`: number       | in milliseconds
 *      `originFile`: string      | the originating file
 *      `properties`: any         | Any properties related to the error. Eg. userId, orderId.
 *      `shouldAlert`: boolean    | Should this error trigger an email alert?
 *      `raw`: string (optional)  | the error as reported by a try/catch block, for example.
 *
 */
export const reportInternalError = functions.https.onRequest(
  async (request: any, response: functions.Response<FunctionsResponse>) => {
    // Get event type. Given the event type, send data to Firestore or otherwise act on the data.
    const body = request.body;

    // Doesn't matter if it's already JSON encoded or not.
    let params: TastiestInternalError;
    try {
      params = JSON.parse(body);
    } catch {
      params = body;
    }

    const {
      code,
      message,
      timestamp,
      originFile,
      properties,
      shouldAlert,
      raw,
    } = params ?? {};

    // This will notify the term internally via email
    if (shouldAlert) {
      const user = functions.config().gmail.developer_email;
      const pass = functions.config().gmail.developer_password;
      const from = '"⚠️ Tastiest Error Reporter" <developers@tastiest.io';
      const to = 'developers@tastiest.io';

      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
      });

      // Stringfiy our properties to be email-friendly.
      let propertiesStringified;
      try {
        propertiesStringified = JSON.stringify(properties);
      } catch {
        propertiesStringified = String(properties);
      }

      // send mail with defined transport object
      const info = await transporter.sendMail({
        from,
        to,
        subject: `${code ?? 'Internal Error Reporting Error'}${
          message ? ' ' + message : ''
        }`,
        text: `
            Error: ${code ?? 'Internal Error Reporting Error'}
            Message: ${message ?? '---'}

            Time: ${moment(timestamp ?? Date.now()).format('Do MMMM YYYY')}
            Originating File: ${originFile ?? '---'}
            Properties: ${propertiesStringified ?? '---'}
            Raw Error: ${raw ?? '---'}
        `,
      });

      // Report email not sent
      if (!info.messageId) {
      }
    }

    if (
      !timestamp ||
      !properties ||
      !code?.length ||
      !message?.length ||
      !originFile?.length
    ) {
      // Report an invalid error (how meta is that?)
      await firebaseAdmin
        .firestore()
        .collection(FirestoreCollection.ERRORS)
        .add({
          code: TastiestInternalErrorCode.INTERNAL_ERROR_REPORTING,
          message:
            'There was an error processing an error report using reportInternalError',
          timestamp: Date.now(),
          originFile: 'functions/src/errors.ts',
          properties: {
            code: code ?? null,
            message: message ?? null,
            timestamp: timestamp ?? null,
            originFile: originFile ?? null,
            properties: properties ?? null,
            raw: raw ?? null,
          },
        });

      response.status(406).end();
      return;
    }

    // Error format is fine - report error to Firestore
    await firebaseAdmin
      .firestore()
      .collection(FirestoreCollection.ERRORS)
      .add({
        code,
        message,
        timestamp,
        originFile,
        properties: properties ?? null,
      });

    response.status(200).end();
    return;
  },
);
