import { Document } from '@contentful/rich-text-types';
import { CuisineSymbol } from './cuisine';
import { IAddress } from './geography';

export type IAuthor = {
  name: string;
  bio: string;
  email: string;
  profileImage?: Media;
  // Eg. Marketing, Researcher
  position: string | null;
};

export type Media = {
  title: string | null;
  description: string | null;
  url: string;
};

export type YouTubeVideo = {
  url: string;
  displayTitle: string | null;
  description: string | null;
};

// Articles link to IDeal
export interface IDeal {
  id: string;
  name: string;
  dishName: string; // Appears in the "Do you know a better ..." section
  image: Media;
  restaurant: IRestaurant;
  includes: Array<string>; // ['300g Porterhouse', 'Fries', ...]
  tagline: string; // Experience the best porterhouse steak in London
  allowedHeads: number[]; // eg [2,4,6] for Date Night
  pricePerHeadGBP: number; // eg 29.95
  additionalInfo: Document | null; // eg; PLUS 1 Mocktail each. In sidebar.
  dynamicImage: Media | null; // .mp4 VP9 600x600, webm fallback.
}

export interface ITastiestDish {
  id: string;
  name: string;
  image: Media;
  dynamicImage: Media;
  restaurant: IRestaurant;
  cuisine: CuisineSymbol;
}

export interface IContact {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

export interface IOrganisation {
  id: string;
  name: string;
  website: string;
  contact: IContact;
  // Restaurant IDs
  restaurants: Array<string>;
}

export interface IMeta {
  title: string; // displayed in google search results
  description: string; // displayed in google search results
  image: Media; // og-image
}

export interface IRestaurant {
  id: string;
  name: string;
  city: string;
  website: string;
  cuisine: CuisineSymbol;
  location: IAddress;
  publicPhoneNumber: string;
  // Contentful has a contact, but we don't want to
  // share that with the user.
  contact?: IContact;

  profilePicture: Media;
  backdropVideo: Media;
  backdropStillFrame: Media;

  bookingSystemSite: string;
  businessType: 'restaurant' | 'take-away' | 'cafe';

  // This is the name as it appears in the URL. Eg. tastiest.io/london/bite-be-burger
  uriName: string;

  // Properties that appear on the restaurant's page at /[city]/[cuisine]/[restaurant]
  heroIllustration: Media;
  description: Document;
  video: YouTubeVideo;

  meta: IMeta;
}

export interface IPost {
  id: string;
  title: string;
  description: string;
  author: IAuthor;
  date: string;

  // Post abstract information
  video: string;
  cuisine: string;
  city: string; // eg. London
  displayLocation: string; // eg. East London

  // Content
  body: Document;
  needToKnow: Document | null;
  deal: IDeal;
  restaurant: IRestaurant;
  titleDivider: Media;
  abstractDivider: Media;
  offerDivider: Media;
  menuImage: Media | null;
  auxiliaryImage: Media | null;

  // Descriptive
  tags: Array<string>;
  slug: string;
  meta: IMeta;
}

export type BodyDocument = {
  nodeType: 'document';
  content: any;
};
