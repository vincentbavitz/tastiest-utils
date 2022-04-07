import { HorusRoutesGET, HorusRoutesPOST } from '@tastiest-io/tastiest-horus';
import nodeFetch from 'node-fetch';
import { useMemo } from 'react';
import useSWR, { Fetcher, SWRConfiguration } from 'swr';
import { dlog } from '..';

type HorusResponse<T = any> = {
  data: T | null;
  error: string | null;
};

type HorusSWROptions = {
  token: string;
  query?: Record<string, string>;
};

// prettier-ignore
const TASTIEST_BACKEND_URL = ['development','test'].includes(process.env.NODE_ENV as string)
    ? 'http://localhost:4444'
    : 'https://api.tastiest.io';

type QueryParams = Record<string, string | number>;

type HorusGetOptions<T = QueryParams> = {
  query?: T;

  /**
   * For routes such as /users/:uid, the dynamic string will be set here.
   * Eg. for the above route and `dynamic = 33`, the final route will
   * be /users/33
   * Currently only supports dynamic string for the end of the endpoint,
   * not between slashes.
   */
  dynamic?: string;
};

/**
 * Horus manages all interactions with the Tastiest API.
 * Server-side only (admin) endpoints are under Horus.Admin
 */
export class Horus {
  constructor(private token: string) {}
  // /support/restaurants/ticket/95285be1-0beb-47ea-849d-41437c4afb2c

  /**
   * Endpoint doesn't include the base path. Eg. do /admin/users.
   * Provide query parameters to the function rather than appending to the endponit.
   * Eg. don't go /users?role=ADMIN, rather set { role: 'ADMIN' } as query object.
   */
  async get<Params = Record<string, string | number>, ResponseType = any>(
    endpoint: HorusRoutesGET,
    options?: HorusGetOptions<Params>,
  ): Promise<HorusResponse<ResponseType>> {
    const queryParams = options?.query ?? {};

    const requestOptions = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    };

    // Are we on a dynamic route? Eg. /users/:uid
    // If so; adjust the endpoint to include the dynamic part.
    if (endpoint.match(/:[\w]*/)) {
      if (!options?.dynamic) {
        throw new Error('Must include `dynamic` for dynamic routes.');
      }

      endpoint = endpoint.replace(
        /\/:[\w]*/,
        `/${options.dynamic}`,
      ) as HorusRoutesGET;
    }

    const url = new URL(endpoint, TASTIEST_BACKEND_URL);
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value as string);
    });

    try {
      // Use server side fetch if necessary
      const response =
        typeof window === 'undefined'
          ? await nodeFetch(url.toString(), requestOptions)
          : await fetch(url.toString(), requestOptions);

      if (response.ok) {
        let data: ResponseType | null = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        return { data, error: null };
      }

      // Response was not OK.
      const errorText = await response.text();

      return {
        data: null,
        error: `${response.statusText}: ${errorText}`,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  /**
   * Endpoint doesn't include the base path. Eg. do /admin/users.
   */
  async post<Params = any, ResponseType = any>(
    endpoint: HorusRoutesPOST,
    params: Params,
  ): Promise<HorusResponse<ResponseType>> {
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    };

    dlog('horus ➡️ options:', options);

    try {
      // Use server side fetch if necessary
      const response =
        typeof window === 'undefined'
          ? await nodeFetch(`${TASTIEST_BACKEND_URL}${endpoint}`, options)
          : await fetch(`${TASTIEST_BACKEND_URL}${endpoint}`, options);

      if (response.ok) {
        let data: ResponseType | null = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        return { data, error: null };
      }

      // Response was not OK.
      const errorText = await response.text();

      return {
        data: null,
        error: `${response.statusText}: ${errorText}`,
      };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }
}

const fetcher = async (url: string, token: string) => {
  // Non-public routes require a token
  if (!url.includes('public') && !token) {
    dlog('useTastiestSWR ➡️ failed');
    return;
  }

  return fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(response => {
    return response.json();
  });
};

/**
 * Endpoint doesn't include the base path. Eg. do /admin/users.
 * Token is the user token from firebase.auth().getIdToken()
 *
 * Use query parameter to append search params to the end of the URL.
 */
export function useHorusSWR<T = any>(
  endpoint: HorusRoutesGET,
  options: HorusSWROptions,
  configuration?: Partial<SWRConfiguration<T>>,
) {
  const path = useMemo(() => {
    // Allows nulling routes;
    // no requests will be made when path is null
    if (!endpoint) {
      return null;
    }

    const _url = new URL(`${TASTIEST_BACKEND_URL}${endpoint}`);

    if (options.query) {
      Object.entries(options.query).map(([key, value]) =>
        _url.searchParams.append(key, value),
      );
    }

    return _url.toString();
  }, [endpoint]);

  return useSWR<T>(
    [path, options.token],
    (fetcher as never) as Fetcher<T>,
    configuration,
  );
}
