import {
  FirestoreCollection,
  FunctionsResponse,
  TastiestInternalError,
  TastiestInternalErrorCode,
} from '@tastiest-io/tastiest-utils';
import * as functions from 'firebase-functions';
import moment from 'moment';
import nodemailer from 'nodemailer';
import { db } from './admin';

/**
 * Report an internal error to the Tastiest Admin Panel
 * Required the following parameters in the body in JSON;
 * ```
 *      code: TastiestInternalErrorCode
 *      // the message as seen in the Tastiest Admin Panel
 *      message: string
 *      // in milliseconds
 *      timestamp: number
 *      // the originating file
 *      originFile: string
 *      // any properties related to the error. Eg. userId, orderId.
 *      properties: any
 *      // should this error trigger an email alert?
 *      shouldAlert: boolean
 *      // severity of the error; CRITICAL | HIGH | NORMAL | LOW
 *      severity: ErrorSeverity
 *      // the error as reported by a try/catch block, for example.
 *      raw: string | undefined
 * ```
 */
export const reportInternalError = functions.https.onRequest(
  async (request: any, response: functions.Response<FunctionsResponse>) => {
    // Allow from origin;
    response.set('Access-Control-Allow-Origin', '*');

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
      severity,
      raw,
    } = params ?? {};

    // This will notify the term internally via email
    if (shouldAlert) {
      try {
        const from = '"⚠️ Tastiest Error Reporter" <vincent@tastiest.io';
        const to = 'developers@tastiest.io';
        const serviceClient = functions.config().gmail.service_client;
        const privateKey = functions.config().gmail.private_key;

        // create reusable transporter object using the default SMTP transport
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            type: 'OAuth2',
            user: 'vincent@tastiest.io',
            serviceClient,
            privateKey,
          },
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
            Severity: ${severity}
            Properties: ${propertiesStringified ?? '---'}
            Raw Error: ${raw ?? '---'}
        `,
        });

        // Report email not sent
        if (!info.messageId) {
        }
      } catch (error) {
        // Report email failed to send
        await db(FirestoreCollection.ERRORS).add({
          code: TastiestInternalErrorCode.INTERNAL_ERROR_REPORTING,
          message: 'Email failed to send from reportInternalError',
          timestamp: Date.now(),
          originFile: 'functions/src/errors.ts',
          severity: 'HIGH',
          properties: {
            code: code ?? null,
            message: message ?? null,
            timestamp: timestamp ?? null,
            originFile: originFile ?? null,
            properties: properties ?? null,
            raw: String(error),
          },
        });

        response.status(200).json({
          success: false,
          data: null,
          error: String(error),
        });
        return;
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
      await db(FirestoreCollection.ERRORS).add({
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
          severity,
        },
      });

      response.status(406).end();
      return;
    }

    // Error format is fine - report error to Firestore
    await db(FirestoreCollection.ERRORS).add({
      code,
      message,
      timestamp,
      originFile,
      severity,
      properties: properties ?? null,
    });

    response.status(200).end();
    return;
  },
);