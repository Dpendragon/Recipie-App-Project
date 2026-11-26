import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { createContext, useEffect, useState, type PropsWithChildren } from 'react';

export type NetworkContextValue = {
  /** true khi thiết bị có mạng dùng được; screen dựa vào đây để gọi API hay đọc cache. */
  isOnline: boolean;
};

export const NetworkContext = createContext<NetworkContextValue | null>(null);

// isConnected có thể là null khi chưa xác định được trạng thái.
// isInternetReachable là null khi NetInfo chưa kiểm tra xong, nên chỉ coi là offline khi nó false.
function toIsOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export function NetworkProvider({ children }: PropsWithChildren) {
  // Mặc định online để UI không nháy thông báo mất mạng trước lần kiểm tra đầu tiên.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // addEventListener phát ngay trạng thái hiện tại, rồi phát tiếp mỗi khi mạng đổi.
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(toIsOnline(state));
    });

    return unsubscribe;
  }, []);

  return <NetworkContext.Provider value={{ isOnline }}>{children}</NetworkContext.Provider>;
}
