import { ContentfulClientApi, createClient } from 'contentful';
import moment from 'moment';
import { dlog } from '..';
import CMS from '../constants/cms';
import { IAuthor, IDeal, IFigureImage, IPost, IRestaurant } from '../types/cms';
import { CuisineSymbol } from '../types/cuisine';
import { IAddress } from '../types/geography';
import { DiscountAmount, IPromo } from '../types/payments';

interface IFetchPostsReturn {
  posts: Array<IPost>;
  total: number;
}

interface IFetchRestaurantsReturn {
  restaurants: Array<IRestaurant>;
  total: number;
}

// Turns CMS IDs into slugs
export const slugify = (id: string) => id?.replace(/_/g, '-').toLowerCase();
export const unslugify = (slug: string) =>
  slug.replace(/-/g, '_').toUpperCase();

interface IGetPostsOptions {
  // Order results cloests to
  near: IAddress;
}

export class CmsApi {
  [x: string]: any;
  client: ContentfulClientApi;

  constructor(
    space: string = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
    accessToken: string = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN ?? '',
    environment: 'production' | 'development' = 'production',
  ) {
    this.client = createClient({
      space,
      accessToken,
      environment,
    });
  }

  public async getPosts(
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
    options: Partial<IGetPostsOptions> = {},
  ): Promise<IFetchPostsReturn> {
    options;

    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      // '[near]'
      limit: quantity,
      skip: (page - 1) * quantity,
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 10,
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
      include: 10,
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
    const { posts } = await this.getPostsOfSlugs([slug], 1);
    return posts?.[0];
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
      include: 10,
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
      include: 10,
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

  public async getPostsOfRestaurant(
    restaurantUriName: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchPostsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 10,
      'fields.restaurant.sys.contentType.sys.id': 'restaurant',
      'fields.restaurant.fields.uriName[in]': restaurantUriName,
    });

    if (entries?.items?.length > 0) {
      const posts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as IPost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as IFetchPostsReturn;
  }

  public async getRestaurants(
    quantity = 100,
    page = 1,
  ): Promise<IFetchRestaurantsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'restaurant',
      limit: quantity,
      skip: (page - 1) * quantity,
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 10,
    });

    if (entries?.items?.length > 0) {
      const restaurants = entries.items
        .map(entry => this.convertRestaurant(entry))
        .filter(post => Boolean(post)) as IRestaurant[];

      return { restaurants, total: entries.total };
    }

    return { restaurants: [], total: 0 } as IFetchRestaurantsReturn;
  }

  public async getRestaurantById(
    restaurantId: string,
  ): Promise<IRestaurant | undefined> {
    const entries = await this.client.getEntries({
      content_type: 'restaurant',
      'fields.id[in]': restaurantId,
      limit: 1,
      include: 10,
    });

    if (entries?.items?.length > 0) {
      const restaurant = this.convertRestaurant(entries.items[0]);
      return restaurant;
    }

    return;
  }

  /**
   * Gets the restaurant from their uri name.
   * Eg. /london/bite-me-burger returns
   * the Bite Me Burger restaurant file from Contentful.
   */
  public getRestaurantFromUriName = async (city: string, uriName: string) => {
    try {
      const entries = await this.client.getEntries({
        content_type: 'restaurant',
        'fields.uriName[in]': uriName,
        'fields.city[in]': city,
        limit: 1,
        include: 10,
      });

      city;
      if (entries?.items?.length > 0) {
        const restaurant = this.convertRestaurant(entries.items[0]);
        return restaurant;
      }
    } catch (error) {
      return;
    }

    return;
  };

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
      include: 10,
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

  public async getTopPosts(limit?: number) {
    // For now this is just a wrapper around getPosts
    return this.getPosts(limit);
  }

  public getDeal = async (dealId: string): Promise<IDeal | undefined> => {
    try {
      const entry = await this.client.getEntry<IDeal>(dealId, {
        include: 10,
      });

      const deal = this.convertDeal(entry);

      return deal;
    } catch {
      return;
    }
  };

  public getPromo = async (code: string): Promise<IPromo | undefined> => {
    const entries = await this.client.getEntries({
      content_type: 'promo',
      'fields.code[in]': code,
      limit: 1,
    });

    if (entries?.items?.length > 0) {
      dlog('cms ➡️ entries?.items[0];:', entries?.items[0]);
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
    const name = rawDeal?.fields?.name;
    const restaurant = this.convertRestaurant(rawDeal?.fields?.restaurant);
    const tagline = rawDeal?.fields?.tagline;
    const includes = rawDeal?.fields?.includes ?? [];
    const pricePerHeadGBP = rawDeal?.fields?.price;
    const image = this.convertImage(rawDeal?.fields?.image?.fields);

    if (
      !id ||
      !name ||
      !restaurant ||
      !tagline ||
      !includes ||
      !pricePerHeadGBP ||
      !image
    ) {
      return;
    }

    return { id, name, restaurant, tagline, includes, pricePerHeadGBP, image };
  };

  public convertLocation = (rawLocation: any): IAddress | undefined => {
    const address = rawLocation?.fields?.address;
    const lat = rawLocation?.fields?.coordinates.lat ?? null;
    const lon = rawLocation?.fields?.coordinates.lon ?? null;

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
    const id = rawRestaurant?.fields?.id;
    const name = rawRestaurant?.fields?.name;
    const uriName = rawRestaurant?.fields?.uriName;
    const city = rawRestaurant?.fields?.city;
    const website = rawRestaurant?.fields?.website;
    const businessType = rawRestaurant?.fields?.businessType;
    const location = this.convertLocation(rawRestaurant?.fields?.location);
    const cuisines = this.convertCuisines(rawRestaurant?.fields?.cuisines);
    const publicPhoneNumber = rawRestaurant?.fields?.phone ?? null;
    const bookingSystemSite = rawRestaurant?.fields?.bookingSystemSite ?? null;
    const profilePicture = this.convertImage(
      rawRestaurant?.fields?.profilePicture?.fields,
    );

    if (
      !id ||
      !name ||
      !website ||
      !city ||
      !businessType ||
      !location ||
      !cuisines ||
      !publicPhoneNumber ||
      !profilePicture ||
      !uriName
      // bookingSystemSite is optional
    ) {
      return;
    }

    return {
      id,
      name,
      uriName,
      website,
      city,
      businessType,
      location,
      cuisines,
      publicPhoneNumber,
      profilePicture,
      bookingSystemSite,
    };
  };

  public convertPost = (rawData: any): IPost | undefined => {
    const rawPost = rawData?.fields;
    const rawFeatureImage = rawPost?.featureImage?.fields;
    const rawAbstractDivider = rawPost?.abstractDivider?.fields;
    const rawTitleDivider = rawPost?.titleDivider?.fields;
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
    const titleDivider = this.convertImage(rawTitleDivider);
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
      !titleDivider ||
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
      titleDivider,
      abstractDivider,
      offerDivider,
    };
  };

  public convertPromo = (rawPromo: any): IPromo | undefined => {
    const amount = rawPromo?.fields?.amountOff ?? 0;
    const unit = (rawPromo?.fields?.discountUnit as '%' | '£') ?? '%';

    const validTo = moment(rawPromo?.fields?.validTo).unix();
    // const validForSlugs = rawPromo?.validForSlugs;
    // const validForUsersIds = rawPromo?.validForUsersIds;
    const discount: DiscountAmount = { value: amount, unit };

    const name = rawPromo?.fields?.name;
    const code = rawPromo?.fields?.code;
    const maximumUses = rawPromo?.fields?.maximumUses ?? null;

    if (
      !name ||
      !code ||
      !discount ||
      !validTo
      // !validForSlugs ||
      // !validForUsersIds
    ) {
      return;
    }

    return {
      name,
      code,
      discount,
      validTo,
      maximumUses,
      // validForSlugs,
      // validForUsersIds,
    };
  };
}
