import firebase from 'firebase';
import nodeFetch from 'node-fetch';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { dlog } from '..';

type HorusResponse<T = any> = {
  data: T | null;
  error: string | null;
};

// prettier-ignore
const TASTIEST_BACKEND_URL = ['development','test'].includes(process.env.NODE_ENV as string)
    ? 'http://localhost:4444'
    : 'https://api.tastiest.io';

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
  async get<QueryParams = Record<string, string | number>, ResponseType = any>(
    endpoint: string,
    query?: QueryParams,
  ): Promise<HorusResponse<ResponseType>> {
    const queryParams = query ?? {};

    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    };

    const url = new URL(endpoint, TASTIEST_BACKEND_URL);
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value as string);
    });

    try {
      // Use server side fetch if necessary
      const response =
        typeof window === 'undefined'
          ? await nodeFetch(url.toString(), options)
          : await fetch(url.toString(), options);

      let data: ResponseType | null = null;
      if (response.ok) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }

  /**
   * Endpoint doesn't include the base path. Eg. do /admin/users.
   */
  async post<Params = any, ResponseType = any>(
    endpoint: string,
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

      let data: ResponseType | null = null;
      if (response.ok) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  }
}

const fetcher = async (url: string, token: string) => {
  if (!token) {
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
 */
export function useHorusSWR<T>(
  endpoint: string,
  user: firebase.User,
  configuration?: Partial<SWRConfiguration<T>>,
) {
  const [token, setToken] = useState<string | null>(null);

  // Set token immediately.
  useEffect(() => {
    user?.getIdToken().then(setToken);
  }, [user, endpoint, configuration]);

  const path = useMemo(() => `${TASTIEST_BACKEND_URL}${endpoint}`, [endpoint]);
  const response = useSWR<T>([path, token], fetcher, configuration);

  return response;
}
