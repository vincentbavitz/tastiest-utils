import dotenv from 'dotenv';
import { dlog } from '../..';
import { CmsApi } from '../../services/cms';

dotenv.config({ path: '.env.local' });

describe('CMS Servcice', () => {
  // test('Get post of slug', async () => {
  //   const cms = new CmsApi();

  //   const post = await cms.getPostBySlug('this-is-a-slug');
  //   // console.log('cms.test ➡️ post:', post);
  //   post;

  //   expect(true).toBeDefined();
  // });

  // it('Convert post', async () => {
  //   const cms = new CmsApi();

  //   const { posts } = await cms.getPosts();
  //   // console.log(
  //   //   'cms.test ➡️ posts:',
  //   //   posts.map(p => p.slug),
  //   // );
  //   // dlog('cms.test ➡️ posts:', posts);

  //   expect(true).toBeDefined();
  // });

  // it('Get promo', async () => {
  //   const cms = new CmsApi();

  //   const promo = await cms.getPromo('10OFF');
  //   // console.log('promo', promo);
  // });

  // it('Get Restaurant from URI Name', async () => {
  //   const cms = new CmsApi();
  //   const restaurant = await cms.getRestaurantFromUriName(
  //     'london',
  //     'bite-me-burger',
  //   );

  //   dlog('cms.test ➡️ restaurant:', restaurant);

  //   expect(true).toBeDefined();
  // });

  it('Get Restaurant Posts', async () => {
    const cms = new CmsApi();
    const posts = await cms.getPostsOfRestaurant('el-vaquero-mill-hill');

    dlog('cms.test ➡️ posts:', posts);

    expect(true).toBeDefined();
  });

  // it('Get restaurant by ID', async () => {
  //   const cms = new CmsApi();
  //   const restaurant = await cms.getRestaurantById(
  //     '8OJeowHe84Z89u9epRA7sbMIayu1',
  //   );

  //   restaurant;
  //   expect(true).toBeDefined();
  // });

  // it('Get Deal by ID', async () => {
  //   const cms = new CmsApi();
  //   const deal = await cms.getDeal('7ET4fQpR2srjbmXWOyk4Lc');

  //   // console.log('deal', deal);
  //   expect(true).toBeDefined();
  // });
});
