const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function requestAuth(path, payload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the login server. Please make sure the API is running.');
  }

  const responseText = await response.text();
  let data = null;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(' ')
      : data.detail?.message || data.detail;
    const readableDetail = typeof detail === 'string' ? detail : responseText;
    throw new Error(readableDetail || `Authentication request failed with status ${response.status}.`);
  }

  return data;
}

export function registerUser({ fullName, accountName, pin, password, confirmPassword }) {
  return requestAuth('/auth/register', {
    full_name: fullName,
    account_name: accountName,
    pin,
    password,
    confirm_password: confirmPassword,
  });
}

export function loginUser({ email, password }) {
  return requestAuth('/auth/login', { email, password });
}

export function saveAuthSession(authData) {
  localStorage.setItem('kabaw_access_token', authData.access_token);
  localStorage.setItem('kabaw_user', JSON.stringify(authData.user));
}

export function getAuthUser() {
  const userJson = localStorage.getItem('kabaw_user');
  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson);
  } catch {
    localStorage.removeItem('kabaw_user');
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem('kabaw_access_token');
  localStorage.removeItem('kabaw_user');
}

export function getUserDisplayName(user) {
  return user?.full_name?.trim() || user?.account_name?.trim() || user?.email?.split('@')[0] || 'User';
}

export function getUserInitial(user) {
  return getUserDisplayName(user).trim().charAt(0).toUpperCase() || 'U';
}

export function startOAuthLogin(provider) {
  const redirectOrigin = encodeURIComponent(window.location.origin);
  window.location.assign(`${API_BASE_URL}/auth/oauth/${provider}/start?redirect_origin=${redirectOrigin}`);
}

export function readOAuthCallback() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  const error = queryParams.get('error') || hashParams.get('error');

  if (error) {
    throw new Error(error);
  }

  const accessToken = hashParams.get('access_token');
  const tokenType = hashParams.get('token_type') || 'bearer';
  const userJson = hashParams.get('user');

  if (!accessToken || !userJson) {
    throw new Error('OAuth sign-in did not return a valid session.');
  }

  return {
    access_token: accessToken,
    token_type: tokenType,
    user: JSON.parse(userJson),
  };
}
