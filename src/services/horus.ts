import nodeFetch from 'node-fetch';
import { dlog } from '..';

/**
 * Horus manages all interactions with the Tastiest API.
 * Server-side only (admin) endpoints are under Horus.Admin
 */
export class Horus {
  public Restaurant: typeof Restaurant;

  constructor() {
    this.Restaurant = Restaurant;
  }
}

type RestaurantEmailScheduleParams = {
  token: string;
  restaurantId: string;
  templateId: string;
  subject: string;
  scheduleFor: number;
};

const Restaurant = {
  Email: {
    schedule: (params: RestaurantEmailScheduleParams) =>
      buildFn('restaurants/notify', params),
  },
};

function buildFn<T = any>(endpoint: string, params: T) {
  return post<T>(`http://localhost:3000/${endpoint}`, { ...params });
}

async function post<Params = any>(
  endpoint: string,
  params: Params,
): Promise<any> {
  const options = {
    method: 'POST',
    body: JSON.stringify(params),
  };

  dlog('horus ➡️ typeof window:', typeof window);

  try {
    // Use server side fetch if necessary
    const response =
      typeof window === 'undefined'
        ? await nodeFetch(endpoint, options)
        : await fetch(endpoint, options);

    return response.json();
  } catch (error) {
    // throw new error();
    return String(error);
  }
}
