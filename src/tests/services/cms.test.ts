import dotenv from 'dotenv';
import { CmsApi, dlog } from '../..';

dotenv.config({ path: '.env.local' });

describe('CMS Servcice', () => {
  test('Convert Posts', async () => {
    const cms = new CmsApi();
    const { posts } = await cms.getPosts(5);

    expect(posts).toBeDefined();

    posts.forEach(post => {
      expect(post).toBeDefined();
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('date');
      expect(post).toHaveProperty('body');
      expect(post).toHaveProperty('tags');
      expect(post).toHaveProperty('slug');
      expect(post).toHaveProperty('meta');
      expect(post).toHaveProperty('city');
      expect(post).toHaveProperty('deal');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('video');
      expect(post).toHaveProperty('author');
      expect(post).toHaveProperty('cuisine');
      expect(post).toHaveProperty('menuImage');
      expect(post).toHaveProperty('needToKnow');
      expect(post).toHaveProperty('restaurant');
      expect(post).toHaveProperty('description');
      expect(post).toHaveProperty('titleDivider');
      expect(post).toHaveProperty('offerDivider');
      expect(post).toHaveProperty('auxiliaryImage');
      expect(post).toHaveProperty('displayLocation');
      expect(post).toHaveProperty('abstractDivider');
    });
  });
  test('Convert Deal', async () => {
    const cms = new CmsApi();
    const deal = await cms.getDeal('5OEoxkYWz8KYAg0rMwVBNi');

    expect(deal).toBeDefined();
    expect(deal).toHaveProperty('id');
    expect(deal).toHaveProperty('name');
    expect(deal).toHaveProperty('image');
    expect(deal).toHaveProperty('restaurant');
    expect(deal).toHaveProperty('includes');
    expect(deal).toHaveProperty('tagline');
    expect(deal).toHaveProperty('allowedHeads');
    expect(deal).toHaveProperty('pricePerHeadGBP');
    expect(deal).toHaveProperty('additionalInfo');
    expect(deal).toHaveProperty('dynamicImage');
  });

  test('Get Post By Deal ID', async () => {
    const cmsApi = new CmsApi();
    const post = await cmsApi.getPostByDealId('v5WWg3Sr573AleBLH9LmH');

    expect(post).toBeDefined();
  });

  test('Get Tastiest Dishes', async () => {
    const cmsApi = new CmsApi();
    const { dishes } = await cmsApi.getTastiestDishes(3);

    dlog('cms.test ➡️ dishes:', dishes);
  });

  // it('Get promo', async () => {
  //   const cms = new CmsApi();

  //   const promo = await cms.getPromo('10OFF');
  //   // console.log('promo', promo);
  // });

  it('Get Restaurant from URI Name', async () => {
    const cms = new CmsApi();
    const restaurant = await cms.getRestaurantFromUriName('bite-me-burger');

    expect(restaurant).toBeDefined();
  });

  it('Get nearby Posts', async () => {
    const cms = new CmsApi();
    const nearSpongebobPosts = await cms.getPosts(5, 1, {
      near: { lat: 25, lon: -92 },
    });

    nearSpongebobPosts;

    // nearSpongebobPosts.posts.map(post => {
    // });
  });

  // it('Get Restaurant Posts', async () => {
  //   const cms = new CmsApi();
  //   const posts = await cms.getPostsOfRestaurant('bite-me-burger');

  //   dlog('cms.test ➡️ posts:', posts);

  //   expect(true).toBeDefined();
  // });

  // it('Get restaurant by ID', async () => {
  //   const cms = new CmsApi();
  //   const restaurant = await cms.getRestaurantById(
  //     '8OJeowHe84Z89u9epRA7sbMIayu1',
  //   );

  //   restaurant;
  //   expect(true).toBeDefined();
  // });

  // it('Get Restaurant Data ID', async () => {
  //   firebaseAdmin.initializeApp({
  //     credential: firebaseAdmin.credential.cert({
  //       privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3XaqfAfM9Ix9t\nCNtlvVzOkl/MUD+TyY5jVC3p44BJH2avu1GukcdcPEvc1ykRQTRgMF2Ng2YAyQvb\nyab2qUOyD+t/2SjqAKGpqNP/8Aod9+fZDjxGv/czEQl42dfQKFneLvwpvkdeC8fh\nxysw8XcbiRYlQbVE6hnvIxrKUnlY3HOweE87ZMLWwsdY8lwgp2KOLbjQtRoI3L3M\na5cz0eNTRUmGczt+dlDOAYttcs3sJu+uAMmuszy3nFI5M0KIJ+LvIyNrRZMXZtSW\nY1bFDBfGMVBXfH3GlYIgqsar1dvX/B9YXwARg3nlJU3NB8HHwKszcM5wEc5B9CN/\nA/bEMaXDAgMBAAECggEAFzyOb6H+ogO+asHRk74AcckIzMpqlB7ZpWq4esgyrJGH\nIMPbIQUmP2EAuBaoBKC/s2TNpi49keHoV8zhFKb0hi8QR95MGgNEeUyEuQ1BKvUM\nc2wjZU/UUqtZCPCKMb27TbWkjOGpB5j0ln730Tb4QgwIO2ZtQzNrX+uR7IuxBvqJ\nxr4eL5UZ7GHfuvV7VuioK7YmpXcx8LJJ+Vl/Vl7q9ZRrgp63R37cSpNYxLYljbxd\nx4wdlDL5BowrA7ph+UEggohOiZZUya8YavJ0W1pUkENM6CZ9Sr3mTveGcvCVXEEn\nV+7c8XqVdf2XBXG3QAcmRDf127uF5UHSBnhs4ZRjgQKBgQDmVFm88DR1MlFvNuE6\nKGZvbXrAH1f7/8DGl+95Zs8mOb4EqVFBJEO8rjA4PAYnPpahv/Jx7+q+BtmFdiZk\n7kPW/tVV//q55VhQ5ZyZ4cOX8I3d5kvoo21a9+1/gZfcG+sVqZpGDOsMYkoFMxgy\nXnew/Vfgdd0PnX3bTpqII7S9wQKBgQDLzV99npd9OI/rQ9goxR2PdbQ5Z+nCJnKI\nJ4YdAOGHugV+aZgp0OZLNc6SKpV8W/Erv3PAoeIiWqlKWGo+P4JmosEdqMq6neqR\nzpZ81v5mK4VDqsIfqCjz7rOOK8hM9K0GEtHE80FxKV7f06XeFYWR44qj0oXTTUR1\n3M0T8K+MgwKBgQCDykHqnNq3MEpuQ02OFG3AVjlFUunqFAW+3FK2+T+QFLwIOMV4\na4KipFyM4LN4oxRXitfzn56Giq7N8bO4TqjcjMWOxsA0u+jTqP35ArgC6S6TiGFo\nxJIe2fu32HQHCqZxp7DRYjTfyiGmZfzzXSBJUjyE/4u0kp3f7VL4kM2rQQKBgQCz\npiOoriXHghaLQlDHD4rRLOZjPBA4zn9jOcPkySQE6ptxJU+2fKikX5fqDJOc/ccH\n00oL4ideNSDJokp0+LLQGmO061dZTV66jKrm/PVfxrlAPsPD+A2xiRbKGhoEjCIB\nGpHC1NM5F0jEcOLjc4E8aqGJa0gATTot0ycLjryQVQKBgFS5qKr2kPcBGXCwvVD3\nEPQYOgsWtKpV38sOnvnHtUHfEbW0rfv5fE2+x2r7zW5jRTbQ7mqupnbFWfLPBYPY\nlOzqRwSsIE6Qu/22XTE1ysSSvsDFzV65YQBxii2equTGWx4BMKHAEO9PD2+1OY3S\n322joqK28Q9+7aqW6tpKCqMh\n-----END PRIVATE KEY-----\n`?.replace(
  //         /\\n/g,
  //         '\n',
  //       ),
  //       clientEmail: `firebase-adminsdk-pyw53@tastiest-dishes.iam.gserviceaccount.com`,
  //       projectId: 'tastiest-dishes',
  //     }),
  //     databaseURL: 'https://tastiest-dishes.firebaseio.com',
  //   });

  //   const restaurantDataApi = new RestaurantDataApi(
  //     firebaseAdmin,
  //     'SqcjThocsqfjrmNqrhQjeyDLRax2',
  //   );

  //   const data = await restaurantDataApi.getRestaurantData();

  //   dlog('cms.test ➡️ data:', data);
  //   // console.log('deal', deal);
  //   expect(true).toBeDefined();
  // });
});
