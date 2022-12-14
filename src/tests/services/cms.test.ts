import dotenv from 'dotenv';
import { CmsApi, dlog, minsIntoHumanTime } from '../..';

dotenv.config({ path: '.env.local' });
const cms = new CmsApi(undefined, undefined, 'production');

describe('Test Luxon', () => {
  test('Luxon', async () => {
    const time = minsIntoHumanTime(564);
    console.log('time', time);
  });
});

describe('Convert Types from CMS', () => {
  test('Convert Posts', async () => {
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
      expect(post).toHaveProperty('product');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('cuisine');
      expect(post).toHaveProperty('menuImage');
      expect(post).toHaveProperty('restaurant');
      expect(post).toHaveProperty('description');
      expect(post).toHaveProperty('displayLocation');
    });
  });
  test('Convert Product', async () => {
    const { posts } = await cms.getPosts();
    posts
      .map(p => p.product)
      .forEach(product => {
        expect(product).toBeDefined();
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('image');
        expect(product).toHaveProperty('restaurant');
        expect(product).toHaveProperty('allowedHeads');
        expect(product).toHaveProperty('price');

        expect(product?.restaurant).toBeDefined();
      });
  });
});

describe('Get Content from CMS', () => {
  // test('Get tastiest dishes of restaurant', async () => {
  //   const { dishes } = await cms.getTastiestDishesOfRestaurant(
  //     'numa-cafe-mill-hill',
  //   );

  //   // dishes.forEach(r => dlog('cms.test ➡️ dishes:', [r.name, r.description]));
  //   expect(dishes).toBeDefined();
  // });

  test('Get all restaurants', async () => {
    const { restaurants } = await cms.getRestaurants();

    dlog(
      'cms.test ➡️ restaurants:',
      restaurants.map(r => r.feature_videos),
    );
    expect(restaurants).toBeDefined();
  });

  // test('Get all posts', async () => {
  //   const { posts } = await cms.getPosts();
  //   expect(posts).toBeDefined();
  // });

  // test('Get Post By Product ID', async () => {
  //   const post = await cms.getPostByProductId('5AmzSHTouV7Kk0GeoZfm2q');
  //   expect(post).toBeDefined();
  // });

  // test('Get Posts of Restaurant', async () => {
  //   const { posts } = await cms.getPostsOfRestaurant('numa-cafe-mill-hill');

  //   expect(posts).toBeDefined();
  // });

  // test('Get Tastiest Dishes of Restaurant', async () => {
  //   const { dishes } = await cms.getTastiestDishes();

  //   expect(dishes).toBeDefined();
  // });

  // test('Get Promo', async () => {
  //   const promo = await cms.getPromo('5OFF');
  //   expect(promo).toBeDefined();
  // });

  // test('Get Restaurant from ID', async () => {
  //   const restaurant = await cms.getRestaurantById(
  //     'zFekbQT8LNaQb5enmzKw5iLe46P2',
  //   );

  //   expect(restaurant).toBeDefined();
  // });

  // test('Get Restaurant from URI Name', async () => {
  //   const restaurant = await cms.getRestaurantFromUriName(
  //     'el-vaquero-mill-hill',
  //   );

  //   expect(restaurant).toBeDefined();
  // });

  // test('Get nearby Posts', async () => {
  //   const nearSpongebobPosts = await cms.getPosts(5, 1, {
  //     near: { lat: 25, lon: -92 },
  //   });

  //   nearSpongebobPosts;

  //   // nearSpongebobPosts.posts.map(post => {
  //   // });
  // });

  // test('Get Restaurant Posts', async () => {
  //   const posts = await cms.getPostsOfRestaurant('bite-me-burger');

  //   expect(posts).toBeDefined();
  // });

  // test('Get Tastiest Dishes of Cuisine', async () => {
  //   const posts = await cms.getTastiestDishesOfCuisine(CuisineSymbol.CARIBBEAN);

  //   expect(posts).toBeDefined();
  // });

  // test('Get restaurant by ID', async () => {
  //   const restaurant = await cms.getRestaurantById(
  //     'zFekbQT8LNaQb5enmzKw5iLe46P2',
  //   );

  //   expect(restaurant).toBeDefined();
  // });

  // test('Global Search Restaurants', async () => {
  //   const searchedRestaurants = await cms.searchRestaurants('back');

  //   expect(searchedRestaurants).toBeDefined();
  // });
});
