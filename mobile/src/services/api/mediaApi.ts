import { apiClient } from './apiClient';

// POST /media/images (Mục 8): gửi ảnh dạng multipart/form-data, nhận lại URL
// để lưu vào recipes.image_url. Backend chỉ nhận JPEG, PNG, WebP và tối đa 5 MB.

// Ảnh nặng hơn JSON nhiều nên nới hạn chờ riêng, không dùng API_TIMEOUT_MS.
const UPLOAD_TIMEOUT_MS = 30000;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const FALLBACK_NAME = 'anh-mon-an.jpg';
const FALLBACK_TYPE = 'image/jpeg';

// expo-image-picker trả uri file cục bộ (file://...) chứ không phải Blob, nên
// tên và kiểu MIME phải suy ra từ phần mở rộng. Không đoán được thì coi là JPEG
// vì picker nén ảnh về JPEG khi quality < 1.
function describeImage(uri: string): { name: string; type: string } {
  const path = uri.split(/[?#]/)[0];
  const segment = path.split('/').pop() ?? '';
  const extension = segment.includes('.')
    ? (segment.split('.').pop() ?? '').toLowerCase()
    : '';
  const type = MIME_BY_EXTENSION[extension];

  if (!type) return { name: FALLBACK_NAME, type: FALLBACK_TYPE };
  return { name: segment, type };
}

export async function uploadImage(uri: string): Promise<string> {
  const { name, type } = describeImage(uri);

  const form = new FormData();
  // React Native nhận { uri, name, type } ở chỗ của Blob; kiểu DOM của
  // FormData không biết dạng này nên phải ép kiểu.
  form.append('file', { uri, name, type } as unknown as Blob);

  const { data } = await apiClient.post<{ url: string }>('/media/images', form, {
    timeout: UPLOAD_TIMEOUT_MS,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
