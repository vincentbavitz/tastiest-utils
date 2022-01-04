import nodeFetch from 'node-fetch';
import { FunctionsResponse } from '..';

/**
 * Gets data from a POST request on our local API.
 * Response type MUST be FunctionsResponse for the endpoint.
 * Local GET endpoints should ALWAYS use SWR not this function.
 */
export const postFetch = async <Params = any, Response = any, TError = string>(
  endpoint: string,
  params: Params,
): Promise<FunctionsResponse<Response, TError>> => {
  const options = {
    method: 'POST',
    body: JSON.stringify(params),
    // headers: new Headers({
    // 'Content-Type': 'application/json',
    // Accept: 'application/json',
    // }),
  };

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

    return { success, data, error } as FunctionsResponse<Response, TError>;
  } catch (error) {
    return { success: false, data: {}, error } as FunctionsResponse<
      Response,
      TError
    >;
  }
};
