export interface Address {
  lat: number;
  lon: number;
  address: string;
  // The location as displayed in the LocationIndicator.
  displayLocation?: string;
}
