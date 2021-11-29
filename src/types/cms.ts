import { Document } from '@contentful/rich-text-types';
import { CuisineSymbol } from './cuisine';
import { RestaurantDetails, RestaurantProfile } from './restaurant';

export type Author = {
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

export type RestaurantContentful = Omit<
  RestaurantDetails & RestaurantProfile,
  'isTest' | 'isDemo' | 'isArchived'
>;

export interface ExperienceProduct {
  id: string;
  name: string;
  dishName: string; // Appears in the "Do you know a better ..." section
  image: Media;
  tagline: string; // Experience the best porterhouse steak in London
  allowedHeads: number[]; // eg [2,4,6] for Date Night
  pricePerHeadGBP: number; // eg 29.95
  additionalInfo: Document | null; // eg; PLUS 1 Mocktail each. In sidebar.
  dynamicImage: Media | null; // .mp4 VP9 600x600, webm fallback.
  restaurant: RestaurantContentful;
}

export interface TastiestDish {
  id: string;
  name: string;
  description: string;
  image: Media;
  dynamicImage: Media;
  cuisine: CuisineSymbol;
  restaurant: RestaurantContentful;
}

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

export interface MetaDetails {
  title: string; // displayed in google search results
  description: string; // displayed in google search results
  image: Media; // og-image
}

export interface ExperiencePost {
  id: string;
  title: string;
  description: string;
  date: string;

  // Refs
  author: Author;
  deal: ExperienceProduct;
  restaurant: RestaurantContentful;

  // Post abstract information
  video: string;
  cuisine: string;
  city: string; // eg. London
  displayLocation: string; // eg. East London

  // Content
  body: Document;
  needToKnow: Document | null;
  plate: Media; // plate SVG
  menuImage: Media | null;
  auxiliaryImage: Media | null;

  // Descriptive
  tags: Array<string>;
  slug: string;
  meta: MetaDetails;
}

export type BodyDocument = {
  nodeType: 'document';
  content: any;
};
