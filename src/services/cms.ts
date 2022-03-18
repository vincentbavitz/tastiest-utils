import {
  DiscountAmount,
  HorusExperiencePost,
  HorusExperienceProduct,
  HorusRestaurant,
  HorusRestaurantProfile,
  Media,
  MetaDetails,
  YouTubeVideo,
} from '@tastiest-io/tastiest-horus';
import { ContentfulClientApi, createClient } from 'contentful';
import moment from 'moment';
import {
  reportInternalError,
  TastiestDish,
  TastiestInternalErrorCode,
} from '..';
import CMS from '../constants/cms';
import { CuisineSymbol } from '../types/cuisine';
import { Address } from '../types/geography';
import { Promo } from '../types/payments';

export type ContentfulRestaurant = Omit<
  HorusRestaurantProfile,
  'restaurant_id'
> &
  Pick<
    HorusRestaurant,
    | 'name'
    | 'city'
    | 'cuisine'
    | 'uri_name'
    | 'location_lat'
    | 'location_lon'
    | 'location_address'
    | 'location_display'
    | 'booking_system'
    | 'is_demo'
    | 'contact_first_name'
    | 'contact_last_name'
    | 'contact_email'
    | 'contact_phone_number'
  >;

export type ContentfulProduct = HorusExperienceProduct & {
  restaurant: ContentfulRestaurant;
};

export type ContentfulPost = Omit<HorusExperiencePost, 'date'> & {
  product: ContentfulProduct;
  restaurant: ContentfulRestaurant;

  // Because JS Dates are hard to JSON serialize.
  date: string;
};

interface FetchPostsReturn {
  posts: Array<ContentfulPost>;
  total: number;
}

interface FetchProductsReturn {
  products: Array<HorusExperienceProduct>;
  total: number;
}

interface FetchDishesReturn {
  dishes: Array<TastiestDish>;
  total: number;
}

interface FetchRestaurantsReturn {
  restaurants: Array<ContentfulRestaurant>;
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
    space: string = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
    accessToken: string = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN ?? '',
    environment: 'production' | 'development' = 'production',
    /** Gives access to protected fields like restaurant.contact */
    adminToken = '',
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
        .filter(post => Boolean(post)) as ContentfulPost[];

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
        .filter(post => Boolean(post)) as ContentfulPost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async getPostBySlug(
    slug: string,
  ): Promise<ContentfulPost | undefined> {
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
        .filter(post => Boolean(post)) as ContentfulPost[];

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
        .filter(post => Boolean(post)) as ContentfulPost[];

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
        .filter(post => Boolean(post)) as ContentfulPost[];

      return { posts, total: entries.total };
    }

    return { posts: [], total: 0 } as FetchPostsReturn;
  }

  public async getPostByProductId(
    productId: string,
  ): Promise<ContentfulPost | undefined> {
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
          r => Boolean(r) && Boolean(r?.is_demo) === getDemoRestaurants,
        ) as ContentfulRestaurant[];

      return { restaurants, total: entries.total };
    }

    return { restaurants: [], total: 0 } as FetchRestaurantsReturn;
  }

  public async getRestaurantById(
    restaurantId: string,
  ): Promise<ContentfulRestaurant | undefined> {
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
        .filter(post => Boolean(post)) as ContentfulPost[];

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
        .filter(restaurant => Boolean(restaurant)) as ContentfulRestaurant[];

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
  ): Promise<ContentfulProduct | undefined> => {
    try {
      const entry = await this.client.getEntry<ContentfulProduct>(productId, {
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
        .filter(product => Boolean(product)) as ContentfulProduct[];

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

  public convertProduct = (rawProduct: any): ContentfulProduct | undefined => {
    const convertAllowedHeads = (rawAllowedHeads: string) => {
      try {
        return JSON.parse(rawAllowedHeads);
      } catch {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      }
    };

    try {
      const product: Partial<ContentfulProduct> = {
        id: rawProduct.sys.id,
        name: rawProduct?.fields?.name,
        restaurant: this.convertRestaurant(rawProduct?.fields?.restaurant),
        price: rawProduct?.fields?.price,
        image: this.convertImage(rawProduct?.fields?.image?.fields),
        allowed_heads: convertAllowedHeads(rawProduct?.fields?.allowedHeads),
      };

      if (
        !product.id ||
        !product.name ||
        !product.restaurant ||
        !product.price ||
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

      return product as ContentfulProduct;
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
  ): ContentfulRestaurant | undefined => {
    const id = rawRestaurant?.fields?.id;
    const city = rawRestaurant?.fields?.city;
    const name = rawRestaurant?.fields?.name;
    const uri_name = rawRestaurant?.fields?.uriName;
    const cuisine = this.convertCuisine(rawRestaurant?.fields?.cuisine);
    const website = rawRestaurant?.fields?.website;
    const location = this.convertLocation(rawRestaurant?.fields?.location);
    const public_phone_number = rawRestaurant?.fields?.phone ?? null;
    const booking_system = rawRestaurant?.fields?.bookingSystem ?? null;

    // Only admins can see contact information.
    const contact = rawRestaurant?.fields?.contact ?? null;

    const profile_picture = this.convertImage(
      rawRestaurant?.fields?.profilePicture?.fields,
    );

    const backdrop_video = this.convertImage(
      rawRestaurant?.fields?.backdropVideo?.fields,
    );

    const backdrop_still_frame = this.convertImage(
      rawRestaurant?.fields?.backdropStillFrame?.fields,
    );

    const display_photograph = this.convertImage(
      rawRestaurant?.fields?.displayPhotograph?.fields,
    );

    // Restaurant page properties
    const description = rawRestaurant?.fields?.description ?? null;
    const hero_illustration = this.convertImage(
      rawRestaurant?.fields?.heroIllustration?.fields,
    );

    const feature_videos =
      rawRestaurant?.fields?.featureVideos?.map?.((v: any) =>
        this.convertYouTubeVideo(v),
      ) ?? [];

    const is_demo = rawRestaurant?.fields?.isDemo ?? false;

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
      !uri_name ||
      !website ||
      !location ||
      !profile_picture ||
      !public_phone_number ||
      !backdrop_video ||
      !backdrop_still_frame ||
      !display_photograph ||
      !hero_illustration ||
      !description ||
      !meta
    ) {
      return;
    }

    const restaurant: ContentfulRestaurant = {
      id,
      name,
      city,
      cuisine,
      uri_name,
      website,
      profile_picture,
      public_phone_number,
      backdrop_video,
      backdrop_still_frame,
      display_photograph,
      booking_system,
      hero_illustration,
      feature_videos,
      description,
      meta,
      is_demo,
      location_lat: location?.lat ?? null,
      location_lon: location?.lon ?? null,
      location_address: location?.address ?? null,
      location_display: location?.displayLocation ?? null,
      contact_first_name: this.isAdmin ? contact?.firstName ?? null : null,
      contact_last_name: this.isAdmin ? contact?.lastName ?? null : null,
      contact_email: this.isAdmin ? contact?.email ?? null : null,
      contact_phone_number: this.isAdmin ? contact?.mobile ?? null : null,
    };

    return restaurant;
  };

  public convertYouTubeVideo = (rawData: any): YouTubeVideo | undefined => {
    return {
      url: rawData.fields.url,
      title: rawData.fields.displayTitle ?? null,
    };
  };

  public convertPost = (rawData: any): ContentfulPost | undefined => {
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

    const post: Partial<ContentfulPost> = {
      id: rawData?.sys?.id,
      title: rawPost?.title,
      description: rawPost?.description,
      body: rawPost?.body,
      date: new Date(rawPost.date).toISOString(),
      city: rawPost?.city,
      cuisine: CuisineSymbol[rawCuisine],
      product: this.convertProduct(rawPost?.product),
      restaurant: this.convertRestaurant(rawPost?.restaurant),
      tags: rawPost?.tags ?? [],
      slug: rawPost?.slug,
      meta: convertMeta(rawPost),
      plate_image: this.convertImage(rawPlate),
      display_location: rawPost?.displayLocation ?? null,
      see_restaurant_button: rawPost?.seeRestaurantButton ?? null,
      menu_image: this.convertImage(rawPost?.menuImage?.fields) ?? null,
      auxiliary_image:
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
      !post.title ||
      !post.cuisine ||
      !post.product ||
      !post.restaurant ||
      !post.plate_image ||
      !post.description ||
      !post.display_location
    ) {
      // dlog('cms ➡️ post.id:', post.id);
      // dlog('cms ➡️ post.tags:', post.tags);
      // dlog('cms ➡️ post.slug:', post.slug);
      // dlog('cms ➡️ post.meta:', post.meta);
      // dlog('cms ➡️ post.body:', post.body);
      // dlog('cms ➡️ post.date:', post.date);
      // dlog('cms ➡️ post.city:', post.city);
      // dlog('cms ➡️ post.title:', post.title);
      // dlog('cms ➡️ post.cuisine:', post.cuisine);
      // dlog('cms ➡️ post.product:', post.product);
      // dlog('cms ➡️ post.plate:', post.plate_image);
      // dlog('cms ➡️ post.restaurant:', post.restaurant);
      // dlog('cms ➡️ post.description:', post.description);
      // dlog('cms ➡️ post.displayLocation:', post.display_location);

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

    return post as ContentfulPost;
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
