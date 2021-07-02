import * as admin from 'firebase-admin';

admin.initializeApp();

export * from './bookings';
export * from './checkout';
export * from './contentful';
export * from './restaurants';
export * from './sessions';
export * from './shopify';
export * from './user';

// /**
//  * To keep on top of errors, we should raise a verbose error report with 6 rather
//  * than simply relying on functions.logger.error. This will calculate users affected + send you email
//  * alerts, if you've opted into receiving them.
//  */

// // [START reporterror]
