// import { FirestoreCollection } from '@tastiest-io/tastiest-utils';
// import * as functions from 'firebase-functions';
// import { db } from './admin';

// // Cache scheduler which keeps track of Tastiest's internal metrics. Updated hourly.
// export const scheduledTastiestCache = functions.pubsub
//   .schedule('0 * * * *')
//   .onRun(context => {
//     console.log('This will be run every hour!');

//     const syncTastiestMetrics = async () => {
//       // totalOrders
//       const totalOrders = await db(FirestoreCollection.ORDERS);

//       // totalRevnue
//       // totalProfit
//       // totalPayouts
//       // totalUsers
//       // totalErrors
//     };

//     const syncRestaurantMetrics = () => {
//       null;
//     };

//     const syncOrderMetrics = () => {
//       // Total orders
//       // Promo code utilisation
//       // etc etc
//     };

//     // unseenErrors → for Admin Panel Sidebar
//     // unseenSupportRequests → for Admin Panel Sidebar

//     // trendingPosts
//     //

//     return null;
//   });
