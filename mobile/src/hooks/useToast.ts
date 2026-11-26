import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastVariant = 'success' | 'error';

export type ToastState = {
  // Tăng mỗi lần hiện để toast mới thay hẳn toast cũ (dùng làm key).
  id: number;
  message: string;
  variant: ToastVariant;
};

const DEFAULT_DURATION_MS = 2500;

// Trạng thái toast của một màn hình: hiện một thông điệp ngắn rồi tự ẩn.
// Gọi showToast liên tiếp thì thông điệp sau thay thông điệp trước.
export function useToast(duration = DEFAULT_DURATION_MS) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      idRef.current += 1;
      setToast({ id: idRef.current, message, variant });
      timerRef.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { toast, showToast };
}
