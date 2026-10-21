import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/constants/api';
import { getToken } from '../auth/authStorage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

// Nếu đang có token thì tự gắn vào header "Authorization: Bearer <token>".
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
