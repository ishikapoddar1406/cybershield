/**
 * CyberShield Secure API Service
 * Centralizes HTTP requests with credentials and automated CSRF synchronization.
 */

let storedCsrfToken = '';

export function setCsrfToken(token) {
  storedCsrfToken = token || '';
}

export function getCsrfToken() {
  return storedCsrfToken;
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    ...options.headers
  };

  // Only set application/json if body is not FormData (for multipart file uploads)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach CSRF token on state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && storedCsrfToken) {
    headers['X-CSRF-Token'] = storedCsrfToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Transmit httpOnly session cookies
    });

    // Handle file downloads directly
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
      if (!response.ok) {
        throw new Error(`Download failed with HTTP ${response.status}`);
      }
      return response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with HTTP ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`[API_ERROR] ${method} ${url}:`, err.message);
    throw err;
  }
}
