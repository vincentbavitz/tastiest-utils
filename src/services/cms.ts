import { dlog } from '@tastiest-io/tastiest-utils';
import { ContentfulClientApi, createClient } from 'contentful';
import moment from 'moment';
import { reportInternalError, TastiestInternalErrorCode } from '..';
import CMS from '../constants/cms';
import {
  ExperiencePost,
  ExperienceProduct,
  Media,
  MetaDetails,
  RestaurantContentful,
  TastiestDish,
} from '../types/cms';
import { CuisineSymbol } from '../types/cuisine';
import { Address } from '../types/geography';
import { DiscountAmount, Promo } from '../types/payments';

interface FetchPostsReturn {
  posts: Array<ExperiencePost>;
  total: number;
}

interface FetchProductsReturn {
  products: Array<ExperienceProduct>;
  total: number;
}

interface FetchDishesReturn {
  dishes: Array<TastiestDish>;
  total: number;
}

interface FetchRestaurantsReturn {
  restaurants: Array<RestaurantContentful>;
  total: number;
}

// Turns CMS IDs into slugs
export const slugify = (id: string) => id?.replace(/_/g, '-').toLowerCase();
export const unslugify = (slug: string) =>
  slug.replace(/-/g, '_').toUpperCase();

interface GetPostsOptions {
  // Order results cloests to
  near: Omit<Address, 'address'>;
}

export class CmsApi {
  [x: string]: any;
  client: ContentfulClientApi;
  isDevelopment: boolean;
  isAdmin: boolean;

  constructor(
    space: string = process.env.CONTENTFUL_SPACE_ID ?? '',
    accessToken: string = process.env.CONTENTFUL_ACCESS_TOKEN ?? '',
    environment: 'production' | 'development' = 'production',
    /** Gives access to protected fields like restaurant.contact */
    adminToken?: string,
  ) {
    this.client = createClient({
      space,
      accessToken,
      environment,
    });

    this.isDevelopment = environment === 'development';
    this.isAdmin = process.env.CONTENTFUL_ADMIN_TOKEN === adminToken;
  }

  public async getPosts(
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
    options?: Partial<GetPostsOptions>,
  ): Promise<FetchPostsReturn> {
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
        .filter(post => Boolean(post)) as ExperiencePost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async getPostsByTag(
    tag: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchPostsReturn> {
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
        .filter(post => Boolean(post)) as ExperiencePost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async getPostBySlug(
    slug: string,
  ): Promise<ExperiencePost | undefined> {
    const { posts } = await this.getPostsOfSlugs([slug], 1);
    return posts?.[0];
  }

  public async getPostsOfSlugs(
    slugs: Array<string>,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchPostsReturn> {
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
        .filter(post => Boolean(post)) as ExperiencePost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async getPostsOfCuisine(
    cuisine: CuisineSymbol,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchPostsReturn> {
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
        .filter(post => Boolean(post)) as ExperiencePost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async getPostsOfRestaurant(
    restaurantUriName: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchPostsReturn> {
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
        .filter(post => Boolean(post)) as ExperiencePost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async getPostByProductId(
    productId: string,
  ): Promise<ExperiencePost | undefined> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      limit: 1,
      include: 10,
      'fields.product.sys.contentType.sys.id': 'product',
      'fields.product.sys.id[in]': productId,
    });

    if (entries?.items?.length > 0) {
      return this.convertPost(entries.items[0]);
    }

    return;
  }

  public async getTastiestDishes(
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchDishesReturn> {
    const entries = await this.client.getEntries({
      content_type: 'tastiestDish',
      limit: quantity,
      skip: (page - 1) * quantity,
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 10,
    });

    if (entries?.items?.length > 0) {
      const dishes = entries.items
        .map(entry => this.convertTastiestDish(entry))
        .filter(dish => Boolean(dish)) as TastiestDish[];

      return { dishes, total: entries.total };
    }

    return { dishes: [], total: 0 } as FetchDishesReturn;
  }

  public async getTastiestDishesOfRestaurant(
    restaurantUriName: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchDishesReturn> {
    const entries = await this.client.getEntries({
      content_type: 'tastiestDish',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 10,
      'fields.restaurant.sys.contentType.sys.id': 'restaurant',
      'fields.restaurant.fields.uriName[in]': restaurantUriName,
    });

    if (entries?.items?.length > 0) {
      const dishes = entries.items
        .map(entry => this.convertTastiestDish(entry))
        .filter(dish => Boolean(dish)) as TastiestDish[];

      return { dishes, total: entries.total };
    }

    return { dishes: [], total: 0 } as FetchDishesReturn;
  }

  public async getTastiestDishesOfCuisine(
    cuisine: CuisineSymbol,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchDishesReturn> {
    const cuisineToMatch = cuisine.toLowerCase();

    const entries = await this.client.getEntries({
      content_type: 'tastiestDish',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 10,
      'fields.cuisine.sys.contentType.sys.id': 'cuisine',
      'fields.cuisine.fields.name[in]': cuisineToMatch,
    });

    if (entries?.items?.length > 0) {
      const dishes = entries.items
        .map(entry => this.convertTastiestDish(entry))
        .filter(dish => Boolean(dish)) as TastiestDish[];

      return { dishes, total: entries.total };
    }

    return { dishes: [], total: 0 } as FetchDishesReturn;
  }

  public async getRestaurants(
    quantity = 100,
    page = 1,
    getDemoRestaurants = false,
  ): Promise<FetchRestaurantsReturn> {
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
        .filter(
          r => Boolean(r) && Boolean(r?.isDemo) === getDemoRestaurants,
        ) as RestaurantContentful[];

      return { restaurants, total: entries.total };
    }

    return { restaurants: [], total: 0 } as FetchRestaurantsReturn;
  }

  public async getRestaurantById(
    restaurantId: string,
  ): Promise<RestaurantContentful | undefined> {
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
  ): Promise<FetchPostsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'post',
      order: '-fields.date',
      limit: quantity,
      skip: (page - 1) * quantity,
      // Allows us to go N layers deep in nested JSON
      // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
      include: 10,
      query: query.trim().toLowerCase(),
    });

    if (entries?.items?.length > 0) {
      const blogPosts = entries.items
        .map(entry => this.convertPost(entry))
        .filter(post => Boolean(post)) as ExperiencePost[];

      return { posts: blogPosts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async searchTastiestDishes(
    query: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchDishesReturn> {
    const entries = await this.client.getEntries({
      content_type: 'tastiestDish',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 10,
      query: query.trim().toLowerCase(),
    });

    if (entries?.items?.length > 0) {
      const dishes = entries.items
        .map(entry => this.convertTastiestDish(entry))
        .filter(dish => Boolean(dish)) as TastiestDish[];

      return { dishes, total: entries.total };
    }

    return { dishes: [], total: 0 } as FetchDishesReturn;
  }

  public async searchRestaurants(
    query: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchRestaurantsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'restaurant',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 10,
      query: query.trim().toLowerCase(),
    });

    if (entries?.items?.length > 0) {
      const restaurants = entries.items
        .map(entry => this.convertRestaurant(entry))
        .filter(restaurant => Boolean(restaurant)) as RestaurantContentful[];

      return { restaurants, total: entries.total };
    }

    return { restaurants: [], total: 0 } as FetchRestaurantsReturn;
  }

  public async getTopPosts(limit?: number) {
    // For now this is just a wrapper around getPosts
    return this.getPosts(limit);
  }

  public getProduct = async (
    productId: string,
  ): Promise<ExperienceProduct | undefined> => {
    try {
      const entry = await this.client.getEntry<ExperienceProduct>(productId, {
        include: 10,
      });

      const product = this.convertProduct(entry);
      return product;
    } catch {
      return;
    }
  };

  public async getProductsOfRestaurant(
    restaurantUriName: string,
    quantity = CMS.BLOG_RESULTS_PER_PAGE,
    page = 1,
  ): Promise<FetchProductsReturn> {
    const entries = await this.client.getEntries({
      content_type: 'product',
      limit: quantity,
      skip: (page - 1) * quantity,
      include: 10,
      'fields.restaurant.sys.contentType.sys.id': 'restaurant',
      'fields.restaurant.fields.uriName[in]': restaurantUriName,
    });

    if (entries?.items?.length > 0) {
      const products = entries.items
        .map(entry => this.convertProduct(entry))
        .filter(product => Boolean(product)) as ExperienceProduct[];

      return { products, total: entries.total };
    }

    return { products: [], total: 0 } as FetchProductsReturn;
  }

  public getPromo = async (code: string): Promise<Promo | undefined> => {
    const entries = await this.client.getEntries({
      content_type: 'promo',
      'fields.code[in]': code,
      limit: 1,
    });

    if (entries?.items?.length > 0) {
      const discount = this.convertPromo(entries.items[0]);
      return discount;
    }

    return;
  };

  public convertImage = (rawImage: any): Media | undefined => {
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

  public convertProduct = (rawProduct: any): ExperienceProduct | undefined => {
    const convertAllowedHeads = (rawAllowedHeads: string) => {
      try {
        return JSON.parse(rawAllowedHeads);
      } catch {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      }
    };

    try {
      const product: Partial<ExperienceProduct> = {
        id: rawProduct.sys.id,
        name: rawProduct?.fields?.name,
        restaurant: this.convertRestaurant(rawProduct?.fields?.restaurant),
        pricePerHeadGBP: rawProduct?.fields?.price,
        allowedHeads: convertAllowedHeads(rawProduct?.fields?.allowedHeads),
        image: this.convertImage(rawProduct?.fields?.image?.fields),
      };

      if (
        !product.id ||
        !product.name ||
        !product.restaurant ||
        !product.pricePerHeadGBP ||
        !product.image
      ) {
        reportInternalError({
          code: TastiestInternalErrorCode.CMS_CONVERSION,
          message: '',
          timestamp: Date.now(),
          originFile: '/src/services/cms.ts:convertProduct',
          shouldAlert: false,
          severity: 'HIGH',
          properties: {
            ...product,
          },
        });

        return;
      }

      return product as ExperienceProduct;
    } catch (error) {
      return;
    }
  };

  public convertLocation = (rawLocation: any): Address | undefined => {
    const lat = rawLocation?.fields?.coordinates.lat ?? null;
    const lon = rawLocation?.fields?.coordinates.lon ?? null;
    const address = rawLocation?.fields?.address;
    const displayLocation = rawLocation?.fields?.displayLocation;

    if (!address || !lat || !lon) {
      return;
    }

    if (displayLocation) {
      return { lat, lon, address, displayLocation };
    } else {
      return { address, lat, lon };
    }
  };

  public convertCuisine = (rawCuisine: any): CuisineSymbol | undefined => {
    if (!rawCuisine) {
      return;
    }

    return CuisineSymbol[
      rawCuisine?.fields?.name?.toUpperCase() as CuisineSymbol
    ];
  };

  public convertRestaurant = (
    rawRestaurant: any,
  ): RestaurantContentful | undefined => {
    const id = rawRestaurant?.fields?.id;
    const city = rawRestaurant?.fields?.city;
    const name = rawRestaurant?.fields?.name;
    const uriName = rawRestaurant?.fields?.uriName;
    const cuisine = this.convertCuisine(rawRestaurant?.fields?.cuisine);
    const website = rawRestaurant?.fields?.website;
    const location = this.convertLocation(rawRestaurant?.fields?.location);
    const businessType = rawRestaurant?.fields?.businessType;
    const publicPhoneNumber = rawRestaurant?.fields?.phone ?? null;
    const bookingSystem = rawRestaurant?.fields?.bookingSystem ?? null;

    // Only admins can see contact information.
    const contact = rawRestaurant?.fields?.contact ?? null;

    const profilePicture = this.convertImage(
      rawRestaurant?.fields?.profilePicture?.fields,
    );

    const backdropVideo = this.convertImage(
      rawRestaurant?.fields?.backdropVideo?.fields,
    );

    const backdropStillFrame = this.convertImage(
      rawRestaurant?.fields?.backdropStillFrame?.fields,
    );

    const displayPhotograph = this.convertImage(
      rawRestaurant?.fields?.displayPhotograph?.fields,
    );

    // Restaurant page properties
    const description = rawRestaurant?.fields?.description ?? null;
    const heroIllustration = this.convertImage(
      rawRestaurant?.fields?.heroIllustration?.fields,
    );

    const isDemo = rawRestaurant?.fields?.isDemo ?? false;

    const convertMeta = (rawRestaurant: any): MetaDetails | undefined => {
      const title = rawRestaurant?.fields?.metaTitle ?? null;
      const description = rawRestaurant?.fields?.metaDescription ?? null;
      const image = this.convertImage(rawRestaurant?.fields?.metaImage?.fields);

      if (!title || !description || !image) {
        return;
      }

      return {
        title,
        description,
        image,
      };
    };

    const meta = convertMeta(rawRestaurant);

    if (
      !id ||
      !name ||
      !city ||
      !cuisine ||
      !uriName ||
      !website ||
      !location ||
      !businessType ||
      !profilePicture ||
      !publicPhoneNumber ||
      !backdropVideo ||
      !backdropStillFrame ||
      !displayPhotograph ||
      !heroIllustration ||
      !description ||
      !meta
    ) {
      return;
    }

    return {
      id,
      name,
      city,
      cuisine,
      uriName,
      website,
      location,
      businessType,
      profilePicture,
      publicPhoneNumber,
      backdropVideo,
      backdropStillFrame,
      displayPhotograph,
      bookingSystem,
      heroIllustration,
      description,
      meta,
      isDemo,
      contact: this.isAdmin ? contact : null,
    };
  };

  public convertPost = (rawData: any): ExperiencePost | undefined => {
    const rawPost = rawData?.fields;
    const rawPlate = rawPost?.plate?.fields;
    const rawCuisine = rawPost?.cuisine?.fields?.name.toUpperCase() as CuisineSymbol;

    const convertMeta = (rawPost: any): MetaDetails | undefined => {
      const title = rawPost?.metaTitle ?? null;
      const description = rawPost?.metaDescription ?? null;
      const image = this.convertImage(rawPost?.metaImage?.fields);

      if (!title || !description || !image) {
        return;
      }

      return {
        title,
        description,
        image,
      };
    };

    const post: Partial<ExperiencePost> = {
      id: rawData?.sys?.id,
      title: rawPost?.title,
      description: rawPost?.description,
      body: rawPost?.body,
      date: moment(rawPost.date).format('DD MMMM YYYY'),
      city: rawPost?.city,
      cuisine: CuisineSymbol[rawCuisine],
      product: this.convertProduct(rawPost?.product),
      restaurant: this.convertRestaurant(rawPost?.restaurant),
      tags: rawPost?.tags ?? [],
      slug: rawPost?.slug,
      meta: convertMeta(rawPost),
      plate: this.convertImage(rawPlate),
      displayLocation: rawPost?.displayLocation ?? null,
      seeRestaurantButton: rawPost?.seeRestaurantButton ?? null,
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
      !post.plate ||
      !post.title ||
      !post.cuisine ||
      !post.product ||
      !post.restaurant ||
      !post.description ||
      !post.displayLocation
    ) {
      dlog('cms ➡️ post.id:', post.id);
      dlog('cms ➡️ post.tags:', post.tags);
      dlog('cms ➡️ post.slug:', post.slug);
      dlog('cms ➡️ post.meta:', post.meta);
      dlog('cms ➡️ post.body:', post.body);
      dlog('cms ➡️ post.date:', post.date);
      dlog('cms ➡️ post.city:', post.city);
      dlog('cms ➡️ post.plate:', post.plate);
      dlog('cms ➡️ post.title:', post.title);
      dlog('cms ➡️ post.cuisine:', post.cuisine);
      dlog('cms ➡️ post.product:', post.product);
      dlog('cms ➡️ post.restaurant:', post.restaurant);
      dlog('cms ➡️ post.description:', post.description);
      dlog('cms ➡️ post.displayLocation:', post.displayLocation);

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

    return post as ExperiencePost;
  };

  public convertTastiestDish = (
    rawTastiestDish: any,
  ): TastiestDish | undefined => {
    const tastiestDish: Partial<TastiestDish> = {
      id: rawTastiestDish?.sys?.id,
      name: rawTastiestDish?.fields?.name,
      description: rawTastiestDish?.fields?.description,
      image: this.convertImage(rawTastiestDish?.fields?.staticImage?.fields),
      restaurant: this.convertRestaurant(rawTastiestDish?.fields?.restaurant),
      cuisine: this.convertCuisine(rawTastiestDish?.fields?.cuisine),
    };

    if (
      !tastiestDish.id ||
      !tastiestDish.name ||
      !tastiestDish.description ||
      !tastiestDish.image ||
      !tastiestDish.restaurant ||
      !tastiestDish.cuisine
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

    return tastiestDish as TastiestDish;
  };

  public convertPromo = (rawPromo: any): Promo | undefined => {
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
