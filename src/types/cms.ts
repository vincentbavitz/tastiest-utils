import { RestaurantDetails, RestaurantProfile } from './restaurant';

export type YouTubeVideo = {
  url: string;
  displayTitle: string | null;
  description: string | null;
};

export type RestaurantContentful = Omit<
  RestaurantDetails & RestaurantProfile,
  'mode' | 'isArchived'
>;

// export interface TastiestDish {
//   id: string;
//   name: string;
//   description: string;
//   image: Media;
//   dynamicImage: Media;
//   cuisine: CuisineSymbol;
//   restaurant: RestaurantContentful;
// }

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

export interface Organisation {
  id: string;
  name: string;
  website: string;
  contact: Contact;
  // Restaurant IDs
  restaurants: Array<string>;
}

export type BodyDocument = {
  nodeType: 'document';
  content: any;
};
