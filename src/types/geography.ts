import { Currency } from '.';

export interface IAddress {
  address: string;
  lat: number;
  lon: number;
}

// //////////////////////////////////// //
//     ALL THE BELOW FOR FUTURE USE     //
// ///////////////////////////////////////
export enum Country {
  UNITED_KINGDOM = 'UNITED_KINGDOM',
}

export enum City {
  LONDON = 'LONDON',
}

export interface CountryContext {
  country: Country;
  currency: Currency;
  shorthand: string;
}

export interface CityContext extends CountryContext {
  city: City;
  shorthand: string;
}
