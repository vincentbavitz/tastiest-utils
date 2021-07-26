import { ContentfulClientApi, createClient } from 'contentful';
import moment from 'moment';
import { dlog, reportInternalError, TastiestInternalErrorCode } from '..';
import CMS from '../constants/cms';
import {
  IAuthor,
  IDeal,
  IFigureImage,
  IPost,
  IPostMeta,
  IRestaurant,
  ITastiestDish,
} from '../types/cms';
import { CuisineSymbol } from '../types/cuisine';
import { IAddress } from '../types/geography';
import { DiscountAmount, IPromo } from '../types/payments';

interface IFetchPostsReturn {
  posts: Array<IPost>;
  total: number;
}

interface IFetchDishesReturn {
  dishes: Array<ITastiestDish>;
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
  near: Omit<IAddress, 'address'>;
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
    options?: Partial<IGetPostsOptions>,
  ): Promise<IFetchPostsReturn> {
    dlog('cms ➡️ options:', options);
    const latLon = `${options?.near?.lat},${options?.near?.lon}`;
    dlog('cms ➡️ latLon:', latLon);

    const entries = await this.client.getEntries({
      content_type: 'post',
      limit: quantity,
      skip: (page - 1) * quantity,
      order: options?.near ? undefined : '-fields.date',
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 10,
      'fields.restaurant.sys.contentType.sys.id': 'restaurant',
      'fields.restaurant.fields.location[near]': options?.near
        ? `${options?.near?.lat},${options?.near?.lon}`
        : undefined,
    });

    if (entries?.items?.length > 0) {
      const posts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as IPost[];

      return { posts, total: entries.total };
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

  public async getPostByDealId(dealId: string): Promise<IPost | undefined> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      limit: 1,
      include: 10,
      'fields.deal.sys.contentType.sys.id': 'deal',
      'fields.deal.sys.id[in]': dealId,
    });

    if (entries?.items?.length > 0) {
      return this.convertPost(entries.items[0]);
    }

    return;
  }

  public async getTastiestDishes(
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<IFetchDishesReturn> {
    const entries = await this.client.getEntries({
      content_type: 'tastiestDish',
      limit: quantity,
      skip: (page - 1) * quantity,
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 10,
    });

    dlog('cms ➡️ entries:', entries);

    if (entries?.items?.length > 0) {
      const dishes = entries.items
        .map(entry => this.convertTastiestDish(entry))
        .filter(dish => Boolean(dish)) as ITastiestDish[];

      return { dishes, total: entries.total };
    }

    return { dishes: [], total: 0 } as IFetchDishesReturn;
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
   * Eg. `bite-me-burger` returns
   * the Bite Me Burger restaurant file from Contentful.
   */
  public getRestaurantFromUriName = async (uriName: string) => {
    try {
      const entries = await this.client.getEntries({
        content_type: 'restaurant',
        'fields.uriName[in]': uriName,
        limit: 1,
        include: 10,
      });

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
    const url = rawImage?.file?.url?.replace('//', 'https://');
    const description = rawImage?.description ?? '';
    const title = rawImage?.title ?? '';

    if (!rawImage || !url) {
      return;
    }

    return {
      url,
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
    const convertAllowedHeads = (rawAllowedHeads: string) => {
      try {
        return JSON.parse(rawAllowedHeads);
      } catch {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      }
    };

    try {
      const deal: Partial<IDeal> = {
        id: rawDeal.sys.id,
        name: rawDeal?.fields?.name,
        dishName: rawDeal?.fields?.dishName,
        restaurant: this.convertRestaurant(rawDeal?.fields?.restaurant),
        tagline: rawDeal?.fields?.tagline,
        includes: rawDeal?.fields?.includes ?? [],
        pricePerHeadGBP: rawDeal?.fields?.price,
        additionalInfo: rawDeal?.fields?.additionalInfo ?? null,
        allowedHeads: convertAllowedHeads(rawDeal?.fields?.allowedHeads),
        image: this.convertImage(rawDeal?.fields?.image?.fields),
        dynamicImage:
          this.convertImage(rawDeal?.fields?.dynamicImage?.fields) ?? null,
      };

      if (
        !deal.id ||
        !deal.name ||
        !deal.dishName ||
        !deal.restaurant ||
        !deal.tagline ||
        !deal.includes ||
        !deal.pricePerHeadGBP ||
        !deal.image
      ) {
        reportInternalError({
          code: TastiestInternalErrorCode.CMS_CONVERSION,
          message: '',
          timestamp: Date.now(),
          originFile: '/src/services/cms.ts:convertDeal',
          shouldAlert: false,
          severity: 'HIGH',
          properties: {
            ...deal,
          },
        });

        return;
      }

      return deal as IDeal;
    } catch (error) {
      dlog('cms ➡️ error:', error);
      return;
    }
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
    const heroIllustration = this.convertImage(
      rawRestaurant?.fields?.heroIllustration?.fields,
    );

    if (
      !id ||
      !name ||
      !city ||
      !uriName ||
      !website ||
      !location ||
      !cuisines ||
      !businessType ||
      !profilePicture ||
      !publicPhoneNumber ||
      !heroIllustration
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
      heroIllustration,
    };
  };

  public convertPost = (rawData: any): IPost | undefined => {
    const rawPost = rawData?.fields;
    const rawAbstractDivider = rawPost?.abstractDivider?.fields;
    const rawTitleDivider = rawPost?.titleDivider?.fields;
    const rawOfferDivider = rawPost?.offerDivider?.fields;
    const rawAuthor = rawPost.author ? rawPost.author.fields : null;
    const rawCuisine = rawPost?.cuisine?.fields?.name.toUpperCase() as CuisineSymbol;

    const convertMeta = (rawPost: any): IPostMeta | undefined => {
      const metaTitle = rawPost?.metaTitle ?? null;
      const metaDescription = rawPost?.metaDescription ?? null;
      const ogImage = this.convertDeal(rawPost?.deal)?.image ?? null;

      if (!metaTitle || !metaDescription || !ogImage) {
        return;
      }

      return {
        metaTitle,
        metaDescription,
        ogImage,
      };
    };

    const post: Partial<IPost> = {
      id: rawData?.sys?.id,
      title: rawPost?.title,
      description: rawPost?.description,
      body: rawPost?.body,
      author: this.convertAuthor(rawAuthor),
      date: moment(rawPost.date).format('DD MMMM YYYY'),
      city: rawPost?.city,
      video: rawPost?.video,
      cuisine: CuisineSymbol[rawCuisine],
      deal: this.convertDeal(rawPost?.deal),
      restaurant: this.convertRestaurant(rawPost?.restaurant),
      tags: rawPost?.tags ?? [],
      slug: rawPost?.slug,
      meta: convertMeta(rawPost),
      titleDivider: this.convertImage(rawTitleDivider),
      abstractDivider: this.convertImage(rawAbstractDivider),
      offerDivider: this.convertImage(rawOfferDivider),
      needToKnow: rawPost?.needToKnow ?? null,
      displayLocation: rawPost?.displayLocation ?? null,
      menuImage: this.convertImage(rawPost?.menuImage?.fields) ?? null,
      auxiliaryImage:
        this.convertImage(rawPost?.auxiliaryImage?.fields) ?? null,
    };

    if (
      !post.id ||
      !post.tags ||
      !post.slug ||
      !post.meta ||
      !post.body ||
      !post.date ||
      !post.city ||
      !post.deal ||
      !post.title ||
      !post.video ||
      !post.author ||
      !post.cuisine ||
      !post.restaurant ||
      !post.description ||
      !post.titleDivider ||
      !post.offerDivider ||
      !post.displayLocation ||
      !post.abstractDivider
    ) {
      reportInternalError({
        code: TastiestInternalErrorCode.CMS_CONVERSION,
        message: '',
        timestamp: Date.now(),
        originFile: '/src/services/cms.ts:convertPost',
        shouldAlert: false,
        severity: 'HIGH',
        properties: {
          ...post,
        },
      });

      return;
    }

    return post as IPost;
  };

  public convertTastiestDish = (
    rawTastiestDish: any,
  ): ITastiestDish | undefined => {
    const tastiestDish: Partial<ITastiestDish> = {
      id: rawTastiestDish?.sys?.id,
      name: rawTastiestDish?.fields?.name,
      image: this.convertImage(rawTastiestDish?.fields?.staticImage?.fields),
      restaurant: this.convertRestaurant(rawTastiestDish?.fields?.restaurant),
      dynamicImage: this.convertImage(
        rawTastiestDish?.fields?.dynamicImage?.fields,
      ),
    };

    if (
      !tastiestDish.id ||
      !tastiestDish.name ||
      !tastiestDish.image ||
      !tastiestDish.dynamicImage ||
      !tastiestDish.restaurant
    ) {
      reportInternalError({
        code: TastiestInternalErrorCode.CMS_CONVERSION,
        message: 'Failed to convert TastiestDish',
        timestamp: Date.now(),
        originFile: '/src/services/cms.ts:convertTastiestDish',
        shouldAlert: false,
        severity: 'HIGH',
        properties: {
          ...tastiestDish,
        },
      });

      return undefined;
    }

    return tastiestDish as ITastiestDish;
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
