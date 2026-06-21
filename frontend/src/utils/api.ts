import { API_URL } from '../config';

export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    console.error('Authentication failed, redirecting to login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }

  return response;
};

export const apiGet = (url: string) => apiRequest(url, { method: 'GET' });
export const apiPost = (url: string, body: any) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (url: string, body: any) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (url: string) => apiRequest(url, { method: 'DELETE' });
