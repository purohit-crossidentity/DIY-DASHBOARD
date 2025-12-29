/**
 * Authentication Utility
 *
 * Handles JWT token generation and management for multi-tenant authentication.
 */

const API_BASE_URL = 'http://localhost:5001/api';

// Mutex to prevent multiple simultaneous token refreshes
let refreshPromise = null;

/**
 * Decode JWT token payload
 */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token) {
  if (!token) return true;

  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferTime = 60 * 1000;

  return currentTime >= (expirationTime - bufferTime);
}

/**
 * Generate JWT token from backend
 * Returns { success: true, data: {...} } or { success: false, error: 'type', message: '...' }
 */
async function generateToken(tenantCode, subtenantCode) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tenant: tenantCode, subtenant: subtenantCode })
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: {
          token: result.data.token,
          tenantId: result.data.tenant,
          subtenantId: result.data.subtenant
        }
      };
    } else {
      console.error('Failed to generate token:', result.message);
      return {
        success: false,
        error: 'auth_failed',
        message: result.message || 'Invalid tenant or subtenant credentials.'
      };
    }
  } catch (error) {
    console.error('Error generating token:', error);

    // Check if it's a network error (server not running)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'server_unavailable',
        message: 'Unable to connect to the server. Please ensure the server is running.'
      };
    }

    return {
      success: false,
      error: 'network_error',
      message: 'A network error occurred. Please check your connection and try again.'
    };
  }
}

/**
 * Store auth data in localStorage
 */
function storeAuthData(authData) {
  localStorage.setItem('auth_token', authData.token);
  localStorage.setItem('tenant_id', authData.tenantId);
  localStorage.setItem('subtenant_id', authData.subtenantId);
  localStorage.setItem('tenant_code', authData.tenantCode);
  localStorage.setItem('subtenant_code', authData.subtenantCode);
}

/**
 * Refresh auth token
 */
export async function refreshAuthToken() {
  const tenantCode = localStorage.getItem('tenant_code');
  const subtenantCode = localStorage.getItem('subtenant_code');

  if (!tenantCode || !subtenantCode) {
    console.error('Cannot refresh token: missing tenant/subtenant codes');
    return null;
  }

  console.log('Refreshing expired token...');
  const result = await generateToken(tenantCode, subtenantCode);

  if (result) {
    storeAuthData({
      token: result.token,
      tenantId: result.tenantId,
      subtenantId: result.subtenantId,
      tenantCode,
      subtenantCode
    });

    console.log('Token refreshed successfully');
    return {
      tenant: result.tenantId,
      subtenant: result.subtenantId,
      token: result.token
    };
  }

  console.error('Failed to refresh token');
  return null;
}

/**
 * Initialize auth from URL parameters (STRICT MODE)
 * Requires tenant and subtenant in URL - no localStorage fallback
 * Returns { success: true, data: {...} } or { success: false, error: 'type', message: '...' }
 */
export async function initializeAuthFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenant = urlParams.get('tenant');
  const subtenant = urlParams.get('subtenant');

  // STRICT: Require URL params always
  if (!tenant || !subtenant) {
    console.warn('Tenant and subtenant required in URL');
    console.warn('Please access with ?tenant=<code>&subtenant=<code>');
    clearAuth();  // Clear any cached credentials
    return {
      success: false,
      error: 'missing_params',
      message: 'Please provide valid tenant and subtenant parameters in the URL.'
    };
  }

  // Check if cached token matches URL params and is still valid
  const storedToken = localStorage.getItem('auth_token');
  const storedTenantCode = localStorage.getItem('tenant_code');
  const storedSubtenantCode = localStorage.getItem('subtenant_code');

  if (storedToken && storedTenantCode === tenant && storedSubtenantCode === subtenant) {
    if (!isTokenExpired(storedToken)) {
      const storedTenantId = localStorage.getItem('tenant_id');
      const storedSubtenantId = localStorage.getItem('subtenant_id');
      console.log('Using cached token (still valid)');
      return {
        success: true,
        data: {
          tenant: parseInt(storedTenantId),
          subtenant: parseInt(storedSubtenantId),
          token: storedToken
        }
      };
    } else {
      console.log('Cached token expired, generating new one...');
    }
  }

  // Generate new token
  const result = await generateToken(tenant, subtenant);

  if (result.success) {
    storeAuthData({
      token: result.data.token,
      tenantId: result.data.tenantId,
      subtenantId: result.data.subtenantId,
      tenantCode: tenant,
      subtenantCode: subtenant
    });

    console.log('New token generated and stored');
    return {
      success: true,
      data: {
        tenant: result.data.tenantId,
        subtenant: result.data.subtenantId,
        token: result.data.token
      }
    };
  }

  console.error('Failed to generate token:', result.message);
  return result;  // Return the error object from generateToken
}

/**
 * Get auth token
 */
export function getAuthToken() {
  const token = localStorage.getItem('auth_token');
  if (token && isTokenExpired(token)) {
    return null;
  }
  return token;
}

/**
 * Get valid auth token, refreshing if necessary
 * Uses a mutex to prevent multiple simultaneous refresh attempts
 */
export async function getValidAuthToken() {
  const token = localStorage.getItem('auth_token');

  if (!token) return null;

  if (isTokenExpired(token)) {
    // If a refresh is already in progress, wait for it
    if (refreshPromise) {
      console.log('Token refresh already in progress, waiting...');
      const result = await refreshPromise;
      return result ? result.token : null;
    }

    // Start a new refresh and store the promise
    console.log('Starting token refresh...');
    refreshPromise = refreshAuthToken();

    try {
      const refreshed = await refreshPromise;
      return refreshed ? refreshed.token : null;
    } finally {
      // Clear the promise after completion
      refreshPromise = null;
    }
  }

  return token;
}

/**
 * Get tenant info
 */
export function getTenantInfo() {
  return {
    tenant: parseInt(localStorage.getItem('tenant_id')),
    subtenant: parseInt(localStorage.getItem('subtenant_id'))
  };
}

/**
 * Clear auth data
 */
export function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('subtenant_id');
  localStorage.removeItem('tenant_code');
  localStorage.removeItem('subtenant_code');
}

/**
 * Check if authenticated
 */
export function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  const { tenant, subtenant } = getTenantInfo();
  return !!(token && !isTokenExpired(token) && tenant && subtenant);
}

/**
 * Handle auth error and refresh
 */
export async function handleAuthError(response, retryFn) {
  if (response.status === 401 || response.status === 403) {
    console.log('Auth error detected, attempting token refresh...');
    const refreshed = await refreshAuthToken();

    if (refreshed) {
      console.log('Token refreshed, retrying request...');
      return await retryFn();
    } else {
      console.error('Token refresh failed');
      clearAuth();
      return null;
    }
  }
  return response;
}
