import { ContentfulClientApi, createClient } from 'contentful';
import moment from 'moment';
import CMS from '../constants/cms';
import {
  IAuthor,
  IDeal,
  IFigureImage,
  ILocation,
  IPost,
  IRestaurant,
} from '../types/cms';
import { CuisineSymbol } from '../types/cuisine';
import { DiscountAmount, IDiscount } from '../types/payments';

interface IFetchPostsReturn {
  posts: Array<IPost>;
  total: number;
}

// Turns CMS IDs into slugs
export const slugify = (id: string) => id?.replace(/_/g, '-').toLowerCase();
export const unslugify = (slug: string) =>
  slug.replace(/-/g, '_').toUpperCase();

export class CmsApi {
  [x: string]: any;
  client: ContentfulClientApi;

  constructor(
    space: string = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
    accessToken: string = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN ?? '',
  ) {
    this.client = createClient({
      space,
      accessToken,
    });
  }

  public async getPosts(
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchPostsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      limit: quantity,
      skip: (page - 1) * quantity,
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 8,
    });

    if (entries?.items?.length > 0) {
      const blogPosts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as IPost[];

      return { posts: blogPosts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchPostsReturn;
  }

  public async getPostsByTag(
    tag: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchPostsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      'fields.tags[in]': tag,
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 8,
    });

    if (entries?.items?.length > 0) {
      const posts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as IPost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchPostsReturn;
  }

  public async getPostBySlug(slug: string): Promise<IPost | undefined> {
    slug;

    const entries = await this.client.getEntries({
      content_type: 'post',
      // 'fields.slug[in]': slug,
      limit: 1,
      include: 8,
    });

    if (entries?.items?.length > 0) {
      const post = this.convertPost(entries.items[0]);
      return post;
    }

    return;
  }

  public async getPostsOfSlugs(
    slugs: Array<string>,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchPostsReturn> {
    console.log('cms ➡️ slugs:', slugs);

    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 8,
      'fields.slug[in]': slugs?.join(','),
    });

    if (entries?.items?.length > 0) {
      const posts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as IPost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchPostsReturn;
  }

  public async getPostsOfCuisine(
    cuisine: CuisineSymbol,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchPostsReturn> {
    const cuisineToMatch = cuisine.toLowerCase();

    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 8,
      'fields.cuisine.sys.contentType.sys.id': 'cuisine',
      'fields.cuisine.fields.name[in]': cuisineToMatch,
    });

    if (entries?.items?.length > 0) {
      const posts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as IPost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchPostsReturn;
  }

  public async getRestaurantsOfOrganisation(organisationID: string) {
    organisationID;
    return null;
  }

  public async searchPosts(
    query: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchPostsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      limit: quantity,
      skip: (page - 1) * quantity,
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 8,
      'fields.title[match]': query.trim().toLowerCase(),
    });

    if (entries?.items?.length > 0) {
      const blogPosts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as IPost[];

      return { posts: blogPosts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchPostsReturn;
  }

  public async getCuisinePosts(cuisine: CuisineSymbol, limit: number) {
    limit;
    cuisine;

    // const query = groq`
    //     *[_type == "post" && cuisine->title match "${titleCase(cuisine)}"][0..${
    //   limit ?? 100
    // }]|order(publishedAt desc) {
    //       ${sanityPostQuery}
    //     }
    //   `;

    // let posts: Array<ISanityArticle>;

    // try {
    //   posts = await client.fetch(query);
    //   console.log('Posts', posts);
    // } catch (error) {
    //   console.warn('Error:', error);
    // }

    // return posts;

    return [];
  }

  public async getTopPosts(limit?: number) {
    // For now this is just a wrapper around getPosts
    return this.getPosts(limit);
  }

  public getDeal = async (dealId: string): Promise<IDeal | undefined> => {
    const entry = await this.client.getEntry(dealId);
    const deal = this.convertDeal(entry);

    return deal;
  };

  public getPromo = async (code: string): Promise<IDiscount | undefined> => {
    const entries = await this.client.getEntries({
      content_type: 'post',
      'fields.code[in]': code,
      limit: 1,
    });

    if (entries?.items?.length > 0) {
      const discount = this.convertPromo(entries.items[0]);
      return discount;
    }

    return;
  };

  public convertImage = (rawImage: any): IFigureImage | undefined => {
    const imageUrl = rawImage?.file?.url?.replace('//', 'https://');
    const description = rawImage?.description ?? '';
    const title = rawImage?.title ?? '';

    if (!rawImage || !imageUrl) {
      return;
    }

    return {
      imageUrl,
      description,
      title,
    };
  };

  public convertAuthor = (rawAuthor: any): IAuthor | undefined => {
    const name = rawAuthor?.name;
    const profileImage = this.convertImage(rawAuthor?.profileImage?.fields);
    const bio = rawAuthor?.bio;
    const position = rawAuthor?.position;
    const email = rawAuthor?.email;

    if (!name || !bio || !position || !email) {
      return undefined;
    }

    return { name, profileImage, bio, position, email };
  };

  public convertDeal = (rawDeal: any): IDeal | undefined => {
    const id = rawDeal.sys.id;
    const restaurant = this.convertRestaurant(rawDeal?.fields?.restaurant);
    const tagline = rawDeal?.fields?.tagline;
    const includes = rawDeal?.fields?.includes ?? [];
    const pricePerHeadGBP = rawDeal?.fields?.price;
    const image = this.convertImage(rawDeal?.fields?.image?.fields);

    if (
      !id ||
      !restaurant ||
      !tagline ||
      !includes ||
      !pricePerHeadGBP ||
      !image
    ) {
      return;
    }

    return { id, restaurant, tagline, includes, pricePerHeadGBP, image };
  };

  public convertLocation = (rawLocation: any): ILocation | undefined => {
    const address = rawLocation?.fields?.address;
    const lat = rawLocation?.fields?.coordinates.lat;
    const lon = rawLocation?.fields?.coordinates.lon;

    if (!address || !lat || !lon) {
      return;
    }

    return { address, lat, lon };
  };

  public convertCuisines = (rawCuisines: any): CuisineSymbol[] => {
    if (!rawCuisines) {
      return [];
    }

    const cuisines: CuisineSymbol[] = rawCuisines
      .map?.(
        (cuisine: any) =>
          CuisineSymbol[cuisine?.fields?.name?.toUpperCase() as CuisineSymbol],
      )
      .filter((cuisine: CuisineSymbol) => Boolean(cuisine));

    return cuisines;
  };

  public convertRestaurant = (rawRestaurant: any): IRestaurant | undefined => {
    const id = rawRestaurant?.sys?.id;
    const name = rawRestaurant?.fields?.name;
    const website = rawRestaurant?.fields?.website;
    const businessType = rawRestaurant?.fields?.businessType;
    const location = this.convertLocation(rawRestaurant?.fields?.location);
    const cuisines = this.convertCuisines(rawRestaurant?.fields?.cuisines);
    const profilePicture = this.convertImage(
      rawRestaurant?.fields?.profilePicture,
    );

    if (
      !id ||
      !name ||
      !website ||
      !businessType ||
      !location ||
      !cuisines ||
      !profilePicture
    ) {
      return;
    }

    return {
      id,
      name,
      website,
      businessType,
      location,
      cuisines,
      profilePicture,
    };
  };

  public convertPost = (rawData: any): IPost | undefined => {
    const rawPost = rawData?.fields;
    const rawFeatureImage = rawPost?.featureImage?.fields;
    const rawAbstractDivider = rawPost?.abstractDivider?.fields;
    const rawOfferDivider = rawPost?.offerDivider?.fields;
    const rawAuthor = rawPost.author ? rawPost.author.fields : null;
    const rawCuisine = rawPost?.cuisine?.fields?.name.toUpperCase() as CuisineSymbol;

    const id = rawData?.sys?.id;
    const title = rawPost?.title;
    const description = rawPost?.description;
    const body = rawPost?.body;
    const author = this.convertAuthor(rawAuthor);
    const date = moment(rawPost.date).format('DD MMMM YYYY');
    const city = rawPost?.city;
    const dishName = rawPost?.dishName;
    const video = rawPost?.video;
    const cuisine = CuisineSymbol[rawCuisine];
    const deal = this.convertDeal(rawPost?.deal);
    const restaurant = this.convertRestaurant(rawPost?.restaurant);
    const featureImage = this.convertImage(rawFeatureImage);
    const tags = rawPost?.tags ?? []; //?.map(t => t?.fields?.label) ?? [];
    const slug = rawPost?.slug;
    const abstractDivider = this.convertImage(rawAbstractDivider);
    const offerDivider = this.convertImage(rawOfferDivider);

    if (
      !id ||
      !title ||
      !description ||
      !body ||
      !author ||
      !date ||
      !city ||
      !dishName ||
      !video ||
      !cuisine ||
      !deal ||
      !restaurant ||
      !featureImage ||
      !tags ||
      !slug ||
      !abstractDivider ||
      !offerDivider
    ) {
      return;
    }

    return {
      id,
      title,
      description,
      body,
      author,
      date,
      city,
      dishName,
      video,
      cuisine,
      deal,
      restaurant,
      featureImage,
      tags,
      slug,
      abstractDivider,
      offerDivider,
    };
  };

  public convertPromo = (rawPromo: any): IDiscount | undefined => {
    const amount = rawPromo?.amountOff ?? null;
    const unit = (rawPromo?.discountUnit as '%' | '£') ?? null;

    const amountOff =
      amount && unit ? ([amount ?? 0, unit ?? '%'] as DiscountAmount) : null;

    const name = rawPromo?.name;
    const promoCode = rawPromo?.code;

    if (!name || !promoCode || !amountOff) {
      return;
    }

    return { name, promoCode, amountOff };
  };
}
