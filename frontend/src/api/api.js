export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// API error class
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.detail || body?.message || `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Fetch wrapper with cookie credentials
export async function sendApiRequest(apiEndpointUrl, requestOptions = {}) {
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...requestOptions.headers,
  };

  try {
    const httpResponse = await fetch(`${API_BASE_URL}${apiEndpointUrl.startsWith('/') ? '' : '/'}${apiEndpointUrl}`, {
      cache: 'no-store',
      ...requestOptions,
      headers: requestHeaders,
      credentials: 'include', // Send cookies with request
    });

    if (httpResponse.status === 204) {
      return undefined;
    }

    const responseDataJson = await httpResponse.json().catch(() => null);

    if (!httpResponse.ok) {
      throw new ApiError(httpResponse.status, responseDataJson);
    }

    return responseDataJson;
  } catch (apiRequestError) {
    console.error(`API error ${apiEndpointUrl}:`, apiRequestError);
    throw apiRequestError;
  }
}
