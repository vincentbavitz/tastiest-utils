import dotenv from 'dotenv';
import { CmsApi } from '../../services/cms';
import { IPost } from '../../types/cms';

dotenv.config({ path: '.env.local' });

interface IPath {
  params: { slug: string; city: string; cuisine: string };
}

describe('CMS Servcice', () => {
  test('Get post of slug', async () => {
    const cms = new CmsApi();

    const post = await cms.getPostBySlug('this-is-a-slug');
    // console.log('cms.test ➡️ post:', post);
    post;

    expect(true).toBeDefined();
  });

  it('Convert post', async () => {
    const cms = new CmsApi();

    const { posts } = await cms.getPosts();
    // console.log(
    //   'cms.test ➡️ posts:',
    //   posts.map(p => p.slug),
    // );
    posts;

    expect(true).toBeDefined();
  });

  it('Get restaurant by ID', async () => {
    const cms = new CmsApi();
    const restaurant = await cms.getRestaurantById(
      '8OJeowHe84Z89u9epRA7sbMIayu1',
    );

    restaurant;
    expect(true).toBeDefined();
  });

  it('Get Deal by ID', async () => {
    const cms = new CmsApi();
    const deal = await cms.getDeal('7ET4fQpR2srjbmXWOyk4Lc');

    console.log('deal', deal);
    expect(true).toBeDefined();
  });

  it('Static slug paths', async () => {
    const cms = new CmsApi();
    let posts: IPost[] = [];
    let page = 1;
    let foundAllPosts = false;

    // Contentful only allows 100 at a time
    while (!foundAllPosts) {
      const { posts: _posts } = await cms.getPosts(100, page);

      if (_posts.length === 0) {
        foundAllPosts = true;
        continue;
      }

      posts = [...posts, ..._posts];
      page++;
    }

    const paths: IPath[] = posts.map(item => ({
      params: {
        city: item.city,
        cuisine: item.cuisine.toLowerCase(),
        slug: item.slug,
      },
    }));

    return { paths, fallback: true };
  });
});
