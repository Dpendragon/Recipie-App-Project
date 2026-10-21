import { Alert } from 'react-native';
import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.';
    }
    const message = (
      error.response.data as { message?: string | string[] } | undefined
    )?.message;
    if (Array.isArray(message) && message.length > 0) return message[0];
    if (typeof message === 'string' && message) return message;
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

export function showComingSoon(featureName: string): void {
  Alert.alert('Sắp ra mắt', `${featureName} sẽ được bổ sung ở các giai đoạn sau.`);
}
