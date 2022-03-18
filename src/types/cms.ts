import { Media } from '@tastiest-io/tastiest-horus';
import { ContentfulRestaurant } from '../services/cms';
import { CuisineSymbol } from './cuisine';

export type BodyDocument = {
  nodeType: 'document';
  content: any;
};

export interface TastiestDish {
  id: string;
  name: string;
  description: string;
  image: Media;
  dynamicImage: Media;
  cuisine: CuisineSymbol;
  restaurant: ContentfulRestaurant;
}
