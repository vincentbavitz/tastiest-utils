import { FunctionsResponse } from '..';

/**
 * Gets data from a POST request on our local API.
 * Response type MUST be FunctionsResponse for the endpoint.
 * Local GET endpoints should ALWAYS use SWR
 */
export const postFetch = async <R>(
  endpoint: string,
  params: any,
): Promise<FunctionsResponse<R>> => {
  const options = {
    method: 'POST',
    body: JSON.stringify(params),
  };

  try {
    const response = await fetch(endpoint, options);
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
