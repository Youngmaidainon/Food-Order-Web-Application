// ดึง URL ของ API จาก Environment (ค่าเริ่มต้นคือ /api)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getApiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

// คลาสจัดการ Error จาก API พร้อมรองรับข้อความตอบกลับจากเซิร์ฟเวอร์
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.detail || body?.message || `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

// ฟังก์ชันกลางสำหรับเรียก API พร้อมแนบ Cookie (Credentials) อัตโนมัติ
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
      credentials: 'include', // สำคัญมากสำหรับการส่ง Cookies หรือข้อมูลเซสชันไปกับ API
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
    throw apiRequestError; // ส่งข้อผิดพลาดต่อไปให้หน้าจอ UI จัดการ
  }
}
