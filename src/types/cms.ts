import { Document } from '@contentful/rich-text-types';
import { CuisineSymbol } from './cuisine';
import { IAddress } from './geography';

export type IAuthor = {
  name: string;
  bio: string;
  email: string;
  profileImage?: IFigureImage;
  // Eg. Marketing, Researcher
  position: string | null;
};

export type IFigureImage = {
  title: string | null;
  description: string | null;
  url: string;
};

// Articles link to IDeal
export interface IDeal {
  id: string;
  name: string;
  dishName: string; // Appears in the "Do you know a better ..." section
  image: IFigureImage;
  restaurant: IRestaurant;
  includes: Array<string>; // ['300g Porterhouse', 'Fries', ...]
  tagline: string; // Experience the best porterhouse steak in London
  allowedHeads: number[]; // eg [2,4,6] for Date Night
  pricePerHeadGBP: number; // eg 29.95
  additionalInfo: Document | null; // eg; PLUS 1 Mocktail each. In sidebar.
  dynamicImage: IFigureImage | null; // .mp4 VP9
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

export interface IPostMeta {
  metaTitle: string;
  metaDescription: string;
  ogImage: IFigureImage;
}

export interface IRestaurant {
  id: string;
  name: string;
  website: string;
  businessType: 'restaurant' | 'take-away' | 'cafe';
  city: string;
  location: IAddress;
  cuisines: CuisineSymbol[];
  publicPhoneNumber: string;
  // Contentful has a contact, but we don't want to
  // share that with the user.
  contact?: IContact;
  profilePicture: IFigureImage;
  bookingSystemSite: string;

  // This is the name as it appears in the URL. Eg. tastiest.io/london/bite-be-burger
  uriName: string;
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
  titleDivider: IFigureImage;
  abstractDivider: IFigureImage;
  offerDivider: IFigureImage;
  menuImage: IFigureImage | null;
  auxiliaryImage: IFigureImage | null;

  // Descriptive
  tags: Array<string>;
  slug: string;
  meta: IPostMeta;
}

export type BodyDocument = {
  nodeType: 'document';
  content: any;
};
