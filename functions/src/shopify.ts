import {
  CmsApi,
  FunctionsResponse,
  generateConfirmationCode,
  generateUserFacingId,
  IBooking,
  IDeal,
  IOrder,
  OrderPrice,
} from '@tastiest-io/tastiest-utils';
import Analytics from 'analytics-node';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import moment from 'moment';
import Stripe from 'stripe';

type PaymentSuccessEvent = IBooking &
  IOrder & {
    firstName: string;
    paidAtDate: string;
    paymentCard: Partial<Stripe.PaymentMethod.Card>;
  };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SegmentAnalytics = require('analytics-node');
const analytics: Analytics = new SegmentAnalytics(
  functions.config().segment.write_key,
);

/**
 * Syncs Shopify tracking to Firestore using webhooks
 */
export const syncShopifyToFirestore = functions.https.onRequest(
  async (request, response: functions.Response<FunctionsResponse>) => {
    // Get event type. Given the event type, send data to Firestore or otherwise act on the data.
    const body = request.body;

    // No event given
    if (!body?.event?.length) {
      response.send({
        success: false,
        error: 'No event given',
        data: null,
      });
      return;
    }

    // Reconstruct payment completion event
    if (body.event === 'Order Completed') {
      // Handled by Shopify Webhook!
      response.send({
        success: true,
        error: null,
        data: null,
      });

      return;
    }

    // Refeed event back into Segment
    try {
      // Events
      if (body?.type === 'track') {
        analytics.track(
          {
            userId: body.userId ?? null,
            anonymousId: body.anonymousId ?? null,
            context: body.context ?? null,
            event: body.event,
            properties: body.properties,
          },
          () => {
            response.send({
              success: true,
              error: null,
              data: null,
            });
          },
        );
      }

      // Page Views
      if (body?.type === 'page') {
        analytics.page(
          {
            userId: body.userId ?? null,
            anonymousId: body.anonymousId ?? null,
            context: body.context ?? null,
            properties: body.properties ?? {},
          },
          () => {
            response.send({
              success: true,
              error: null,
              data: null,
            });
          },
        );
      }

      return;
    } catch (error) {
      response.send({
        success: false,
        error: `Error: ${error}`,
        data: null,
      });
      return;
    }
  },
);

const FullOrderEvent = {
  id: 3875553706183,
  admin_graphql_api_id: 'gid://shopify/Order/3875553706183',
  app_id: 580111,
  browser_ip: '217.138.221.236',
  buyer_accepts_marketing: false,
  cancel_reason: null,
  cancelled_at: null,
  cart_token: 'd80843598970ca8841cf9a184b14247a',
  checkout_id: 20678435897543,
  checkout_token: '6951d8251ed528facd2239fbc06905e0',
  client_details: {
    accept_language: 'en-GB,en-US;q=0.9,en;q=0.8',
    browser_height: 913,
    browser_ip: '217.138.221.236',
    browser_width: 1905,
    session_hash: null,
    user_agent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Safari/537.36',
  },
  closed_at: null,
  confirmed: true,
  contact_email: 'xvrain@protonmail.com',
  created_at: '2021-05-25T07:44:06+01:00',
  currency: 'GBP',
  current_subtotal_price: '741.00',
  current_subtotal_price_set: {
    shop_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
  },
  current_total_discounts: '0.00',
  current_total_discounts_set: {
    shop_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
  },
  current_total_duties_set: null,
  current_total_price: '741.00',
  current_total_price_set: {
    shop_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
  },
  current_total_tax: '0.00',
  current_total_tax_set: {
    shop_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
  },
  customer_locale: 'en',
  device_id: null,
  discount_codes: [],
  email: 'xvrain@protonmail.com',
  financial_status: 'paid',
  fulfillment_status: null,
  gateway: 'shopify_payments',
  landing_site: '/password',
  landing_site_ref: null,
  location_id: null,
  name: '#1002',
  note: null,
  note_attributes: [
    {
      name: 'segment-clientID',
      value: '85949229-a85c-4cca-ba4e-5b3fd36c4fed',
    },
    {
      name: 'littledata_updatedAt',
      value: '1621726356590',
    },
  ],
  number: 2,
  order_number: 1002,
  order_status_url:
    'https://offers.tastiest.io/57208144071/orders/d2bdf87c7c3040829a72d676e9311d40/authenticate?key=b29cc17f4a515c1dc26f70b655830eb0',
  original_total_duties_set: null,
  payment_gateway_names: ['shopify_payments'],
  phone: null,
  presentment_currency: 'GBP',
  processed_at: '2021-05-25T07:44:05+01:00',
  processing_method: 'direct',
  reference: null,
  referring_site: '',
  source_identifier: null,
  source_name: 'web',
  source_url: null,
  subtotal_price: '741.00',
  subtotal_price_set: {
    shop_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
  },
  tags: '',
  tax_lines: [],
  taxes_included: true,
  test: true,
  token: 'd2bdf87c7c3040829a72d676e9311d40',
  total_discounts: '0.00',
  total_discounts_set: {
    shop_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
  },
  total_line_items_price: '741.00',
  total_line_items_price_set: {
    shop_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
  },
  total_outstanding: '0.00',
  total_price: '741.00',
  total_price_set: {
    shop_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '741.00',
      currency_code: 'GBP',
    },
  },
  total_price_usd: '1047.88',
  total_shipping_price_set: {
    shop_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
  },
  total_tax: '0.00',
  total_tax_set: {
    shop_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
    presentment_money: {
      amount: '0.00',
      currency_code: 'GBP',
    },
  },
  total_tip_received: '0.00',
  total_weight: 0,
  updated_at: '2021-05-25T07:44:07+01:00',
  user_id: null,
  billing_address: {
    first_name: 'Albert',
    address1: 'Floor 2 555-557, Cranbrook Road',
    phone: '01231 231234',
    city: 'Ilford',
    zip: 'IG2 6HE',
    province: 'England',
    country: 'United Kingdom',
    last_name: 'Krabs',
    address2: null,
    company: null,
    latitude: 51.5760753,
    longitude: 0.0657528,
    name: 'Albert Krabs',
    country_code: 'GB',
    province_code: 'ENG',
  },
  customer: {
    id: 5272566202567,
    email: 'xvrain@protonmail.com',
    accepts_marketing: false,
    created_at: '2021-05-25T07:41:11+01:00',
    updated_at: '2021-05-25T07:44:07+01:00',
    first_name: 'Albert',
    last_name: 'Krabs',
    orders_count: 0,
    state: 'disabled',
    total_spent: '0.00',
    last_order_id: null,
    note: null,
    verified_email: true,
    multipass_identifier: null,
    tax_exempt: false,
    phone: null,
    tags: '',
    last_order_name: null,
    currency: 'GBP',
    accepts_marketing_updated_at: '2021-05-25T07:41:11+01:00',
    marketing_opt_in_level: null,
    admin_graphql_api_id: 'gid://shopify/Customer/5272566202567',
    default_address: {
      id: 6481406623943,
      customer_id: 5272566202567,
      first_name: 'Albert',
      last_name: 'Krabs',
      company: null,
      address1: 'Floor 2 555-557, Cranbrook Road',
      address2: null,
      city: 'Ilford',
      province: 'England',
      country: 'United Kingdom',
      zip: 'IG2 6HE',
      phone: '01231 231234',
      name: 'Albert Krabs',
      province_code: 'ENG',
      country_code: 'GB',
      country_name: 'United Kingdom',
      default: true,
    },
  },
  discount_applications: [],
  fulfillments: [],
  line_items: [
    {
      id: 10038069133511,
      admin_graphql_api_id: 'gid://shopify/LineItem/10038069133511',
      fulfillable_quantity: 1,
      fulfillment_service: 'manual',
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: 'Just a Spoonful of Sugar 2',
      origin_location: {
        id: 2932142506183,
        country_code: 'GB',
        province_code: 'ENG',
        name: 'Tastiest',
        address1: '104 Granville Road',
        address2: '',
        city: 'London',
        zip: 'UB10 9AG',
      },
      price: '10.00',
      price_set: {
        shop_money: { amount: '10.00', currency_code: 'GBP' },
        presentment_money: { amount: '10.00', currency_code: 'GBP' },
      },
      product_exists: true,
      product_id: 6752776716487,
      properties: [],
      quantity: 1,
      requires_shipping: false,
      sku: '',
      taxable: true,
      title: 'Just a Spoonful of Sugar 2',
      total_discount: '0.00',
      total_discount_set: {
        shop_money: { amount: '0.00', currency_code: 'GBP' },
        presentment_money: { amount: '0.00', currency_code: 'GBP' },
      },
      variant_id: 40036207165639,
      variant_inventory_management: 'shopify',
      variant_title: '',
      vendor: 'Test Restaurant',
      tax_lines: [],
      duties: [],
      discount_allocations: [],
    },
    {
      id: 10038069166279,
      admin_graphql_api_id: 'gid://shopify/LineItem/10038069166279',
      fulfillable_quantity: 1,
      fulfillment_service: 'manual',
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: 'Just a Spoonful of Sugar 1',
      origin_location: {
        id: 2932142506183,
        country_code: 'GB',
        province_code: 'ENG',
        name: 'Tastiest',
        address1: '104 Granville Road',
        address2: '',
        city: 'London',
        zip: 'UB10 9AG',
      },
      price: '10.00',
      price_set: {
        shop_money: { amount: '10.00', currency_code: 'GBP' },
        presentment_money: { amount: '10.00', currency_code: 'GBP' },
      },
      product_exists: true,
      product_id: 6752558350535,
      properties: [],
      quantity: 1,
      requires_shipping: false,
      sku: '',
      taxable: true,
      title: 'Just a Spoonful of Sugar 1',
      total_discount: '0.00',
      total_discount_set: {
        shop_money: { amount: '0.00', currency_code: 'GBP' },
        presentment_money: { amount: '0.00', currency_code: 'GBP' },
      },
      variant_id: 40034381398215,
      variant_inventory_management: 'shopify',
      variant_title: '',
      vendor: 'Test Restaurant',
      tax_lines: [],
      duties: [],
      discount_allocations: [],
    },
    {
      id: 10038069199047,
      admin_graphql_api_id: 'gid://shopify/LineItem/10038069199047',
      fulfillable_quantity: 1,
      fulfillment_service: 'manual',
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: 'Just a Spoonful of Sugar 3',
      origin_location: {
        id: 2932142506183,
        country_code: 'GB',
        province_code: 'ENG',
        name: 'Tastiest',
        address1: '104 Granville Road',
        address2: '',
        city: 'London',
        zip: 'UB10 9AG',
      },
      price: '10.00',
      price_set: {
        shop_money: { amount: '10.00', currency_code: 'GBP' },
        presentment_money: { amount: '10.00', currency_code: 'GBP' },
      },
      product_exists: true,
      product_id: 6752776945863,
      properties: [],
      quantity: 1,
      requires_shipping: false,
      sku: '',
      taxable: true,
      title: 'Just a Spoonful of Sugar 3',
      total_discount: '0.00',
      total_discount_set: {
        shop_money: { amount: '0.00', currency_code: 'GBP' },
        presentment_money: { amount: '0.00', currency_code: 'GBP' },
      },
      variant_id: 40036207820999,
      variant_inventory_management: 'shopify',
      variant_title: '',
      vendor: 'Test Restaurant',
      tax_lines: [],
      duties: [],
      discount_allocations: [],
    },
    {
      id: 10038069231815,
      admin_graphql_api_id: 'gid://shopify/LineItem/10038069231815',
      fulfillable_quantity: 9,
      fulfillment_service: 'manual',
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: 'The Mightiest Steak in London 3',
      origin_location: {
        id: 2932142506183,
        country_code: 'GB',
        province_code: 'ENG',
        name: 'Tastiest',
        address1: '104 Granville Road',
        address2: '',
        city: 'London',
        zip: 'UB10 9AG',
      },
      price: '79.00',
      price_set: {
        shop_money: { amount: '79.00', currency_code: 'GBP' },
        presentment_money: { amount: '79.00', currency_code: 'GBP' },
      },
      product_exists: true,
      product_id: 6752776552647,
      properties: [],
      quantity: 9,
      requires_shipping: false,
      sku: '',
      taxable: true,
      title: 'The Mightiest Steak in London 3',
      total_discount: '0.00',
      total_discount_set: {
        shop_money: { amount: '0.00', currency_code: 'GBP' },
        presentment_money: { amount: '0.00', currency_code: 'GBP' },
      },
      variant_id: 40036205461703,
      variant_inventory_management: 'shopify',
      variant_title: '',
      vendor: 'Test Restaurant',
      tax_lines: [],
      duties: [],
      discount_allocations: [],
    },
  ],
  payment_details: {
    credit_card_bin: '424242',
    avs_result_code: 'Y',
    cvv_result_code: 'M',
    credit_card_number: '•••• •••• •••• 4242',
    credit_card_company: 'Visa',
  },
  refunds: [],
  shipping_lines: [],
};
FullOrderEvent;

export const shopifyPaymentSuccessWebhook = functions.https.onRequest(
  async (request, response: functions.Response<FunctionsResponse>) => {
    const body = request.body;

    admin.firestore().collection('webhook').add(body);

    try {
      // There should only be one product per cart. So we just grab the first one.
      const product = body.line_items?.[0];

      // Does this order already exist? Ignore duplicates
      const potentialDuplicateOrderSnapshot = await admin
        .firestore()
        .collection('orders')
        .where('id', '==', String(body.id))
        .limit(1)
        .get();

      let potentialDuplicateOrder: IOrder | null = null;
      potentialDuplicateOrderSnapshot.docs.forEach(
        doc => (potentialDuplicateOrder = doc.data() as IOrder),
      );

      // Exit here if the order already exists.
      if (potentialDuplicateOrder) {
        response.send();
        return;
      }

      // Get the deal (offer) from Contentful
      const cms = new CmsApi(
        functions.config().contentful.space_id,
        functions.config().contentful.access_token,
      );

      const deal = (await cms.getDeal(product.sku)) as IDeal;

      const userId = body?.customer?.id;
      const heads = product.quantity;
      const userFacingId = generateUserFacingId();
      const cardNumber = body.payment_details.credit_card_number;

      const price: OrderPrice = {
        gross: body.subtotal_price,
        final: body.total_price,
        currency: 'GBP',
      };

      const order: IOrder = {
        id: String(body.id),
        userFacingOrderId: userFacingId,
        token: '',
        userId,
        deal,
        heads,
        fromSlug: '',
        price,
        paymentMethod: null,
        promoCode: '',
        paidAt: Date.now(),
        createdAt: Date.now(),
        abandonedAt: null,
        refund: null,
      };

      const booking: IBooking = {
        orderId: String(body.id),
        userFacingBookingId: userFacingId,
        restaurantId: deal?.restaurant?.id,
        eaterName: body?.customer?.first_name,
        dealName: deal?.name,
        heads,
        price,
        paidAt: Date.now(),
        bookingDate: null,
        hasBooked: false,
        hasArrived: false,
        hasCancelled: false,
        cancelledAt: null,
        confirmationCode: generateConfirmationCode(),
        isConfirmationCodeVerified: false,
      };

      // Sync to Firebase
      admin.firestore().collection('orders').add(order);
      admin.firestore().collection('bookings').add(booking);

      // Reconstruct the deal (offer) from the SKU where the
      // SKU is the Deal ID in Contentful
      const reconstructedPaymentEvent: PaymentSuccessEvent = {
        ...order,
        ...booking,
        paymentCard: {
          brand: body.payment_details.credit_card_company.toLowerCase(),
          last4: cardNumber.slice(cardNumber.length - 4),
        },
        paidAtDate: moment(Date.now()).format('Do MMMM YYYY'),
        firstName: body?.customer?.first_name,
      };

      // Set user data - even if the account doesn't exist yet
      // ... now we have their address and payment information
      // Should we store user information in our collection using
      // their email as the ID instead of userId?

      // First identify them
      analytics.identify({
        userId,
        traits: {
          email: body.customer.email ?? body.email,
        },
      });

      analytics.track({
        event: 'Payment Success',
        userId,
        properties: reconstructedPaymentEvent,
      });

      admin
        .firestore()
        .collection('reconstructed')
        .add(reconstructedPaymentEvent);

      // Terminate here!
      response.send();
    } catch (error) {
      admin
        .firestore()
        .collection('error')
        .add({ error: String(error) });
    }
    return;
  },
);
