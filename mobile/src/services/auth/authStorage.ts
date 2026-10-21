import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/storageKeys';

// Token "tạm" chỉ sống trong bộ nhớ RAM của app
let memoryToken: string | null = null;

// Đọc token: ưu tiên bản trong RAM, không có thì đọc từ SecureStore
export async function getToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  return SecureStore.getItemAsync(STORAGE_KEYS.sessionToken);
}

// Lưu token
export async function setToken(token: string, remember = true): Promise<void> {
  memoryToken = token;
  if (remember) {
    await SecureStore.setItemAsync(STORAGE_KEYS.sessionToken, token);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.sessionToken);
  }
}

// Xoá token ở cả hai nơi
export async function deleteToken(): Promise<void> {
  memoryToken = null;
  await SecureStore.deleteItemAsync(STORAGE_KEYS.sessionToken);
}
