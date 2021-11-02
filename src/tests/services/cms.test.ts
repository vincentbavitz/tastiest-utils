import dotenv from 'dotenv';
import { CmsApi, CuisineSymbol, dlog, minsIntoHumanTime } from '../..';

dotenv.config({ path: '.env.local' });

describe('Test Luxon', () => {
  test('Luxon', async () => {
    const time = minsIntoHumanTime(564);
    console.log('time', time);
  });
});

describe('Convert Types from CMS', () => {
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
});

describe('Get Content from CMS', () => {
  test('Get Post By Deal ID', async () => {
    const cmsApi = new CmsApi();
    const post = await cmsApi.getPostByDealId('v5WWg3Sr573AleBLH9LmH');

    expect(post).toBeDefined();
  });

  test('Get Tastiest Dishes of Restaurant', async () => {
    const cmsApi = new CmsApi();
    const { dishes } = await cmsApi.getTastiestDishesOfRestaurant(
      'bite-me-burger',
    );

    expect(dishes).toBeDefined();
  });

  test('Get promo', async () => {
    const cms = new CmsApi();
    const promo = await cms.getPromo('5OFF');
    expect(promo).toBeDefined();
  });

  test('Get Restaurant from ID', async () => {
    const cms = new CmsApi();
    const restaurant = await cms.getRestaurantById(
      'YvN7B347c7bL58ZuQVqTBI6rPE53',
    );

    expect(restaurant).toBeDefined();
  });

  test('Get Restaurant from URI Name', async () => {
    const cms = new CmsApi();
    const restaurant = await cms.getRestaurantFromUriName('back-a-yard-grill');

    expect(restaurant).toBeDefined();
  });

  test('Get nearby Posts', async () => {
    const cms = new CmsApi();
    const nearSpongebobPosts = await cms.getPosts(5, 1, {
      near: { lat: 25, lon: -92 },
    });

    nearSpongebobPosts;

    // nearSpongebobPosts.posts.map(post => {
    // });
  });

  test('Get Restaurant Posts', async () => {
    const cms = new CmsApi();
    const posts = await cms.getPostsOfRestaurant('bite-me-burger');

    expect(posts).toBeDefined();
  });

  test('Get Tastiest Dishes of Cuisine', async () => {
    const cms = new CmsApi();
    const posts = await cms.getTastiestDishesOfCuisine(CuisineSymbol.CARIBBEAN);

    expect(posts).toBeDefined();
  });

  test('Get restaurant by ID', async () => {
    const cms = new CmsApi();
    const restaurant = await cms.getRestaurantById(
      'zFekbQT8LNaQb5enmzKw5iLe46P2',
    );

    dlog('cms.test ➡️ restaurant:', restaurant);

    expect(restaurant).toBeDefined();
  });

  test('Global Search Restaurants', async () => {
    const cms = new CmsApi();
    const searchedRestaurants = await cms.searchRestaurants('back');

    expect(searchedRestaurants).toBeDefined();
  });
});
