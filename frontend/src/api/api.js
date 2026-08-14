const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.detail || body?.message || `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function sendApiRequest(apiEndpointUrl, requestOptions = {}) {
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...requestOptions.headers,
  };

  try {
    const httpResponse = await fetch(`${API_BASE_URL}${apiEndpointUrl.startsWith('/') ? '' : '/'}${apiEndpointUrl}`, {
      ...requestOptions,
      headers: requestHeaders,
      credentials: 'include', // Important for sending cookies/session
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
    console.error(`เกิดข้อผิดพลาดในการเรียก API ${apiEndpointUrl}:`, apiRequestError);
    throw apiRequestError; // Throw to be handled by the UI
  }
}
