import nodeFetch from 'node-fetch';
import { dlog, FunctionsResponse } from '..';

/**
 * Gets data from a POST request on our local API.
 * Response type MUST be FunctionsResponse for the endpoint.
 * Local GET endpoints should ALWAYS use SWR not this function.
 */
export const postFetch = async <P = any, R = any>(
  endpoint: string,
  params: P,
): Promise<FunctionsResponse<R>> => {
  const options = {
    method: 'POST',
    body: JSON.stringify(params),
    // headers: new Headers({
    // 'Content-Type': 'application/json',
    // Accept: 'application/json',
    // }),
  };

  dlog('api ➡️ endpoint:', endpoint);

  try {
    // Use server side fetch if necessary
    const response =
      typeof window === 'undefined'
        ? await nodeFetch(endpoint, options)
        : await fetch(endpoint, options);

    const {
      success = false,
      data = null,
      error = null,
    } = await response.json();

    return { success, data, error } as FunctionsResponse<R>;
  } catch (error) {
    return { success: false, data: {}, error } as FunctionsResponse<R>;
  }
};
