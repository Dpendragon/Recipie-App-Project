import type {
  CreateShoppingItemRequest,
  ShoppingItem,
  UpdateShoppingItemRequest,
} from '@/types/shopping.types';
import { apiClient } from './apiClient';

// GET /shopping-items — toàn bộ danh sách (không phân trang).
export async function getShoppingItems(): Promise<ShoppingItem[]> {
  const { data } = await apiClient.get<ShoppingItem[]>('/shopping-items');
  return data;
}

// POST /shopping-items — thêm tay vào khu vực "Của tôi"
export async function createShoppingItem(
  body: CreateShoppingItemRequest,
): Promise<ShoppingItem> {
  const { data } = await apiClient.post<ShoppingItem>('/shopping-items', body);
  return data;
}

// PATCH /shopping-items/:id — đánh dấu đã mua hoặc sửa ghi chú
export async function updateShoppingItem(
  id: number,
  body: UpdateShoppingItemRequest,
): Promise<ShoppingItem> {
  const { data } = await apiClient.patch<ShoppingItem>(`/shopping-items/${id}`, body);
  return data;
}

// DELETE /shopping-items/:id — 204 kể cả khi dòng đã bị xoá trước đó
export async function deleteShoppingItem(id: number): Promise<void> {
  await apiClient.delete(`/shopping-items/${id}`);
}
