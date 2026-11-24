import { useContext } from 'react';
import { NetworkContext } from '@/contexts/NetworkContext';

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('useNetwork phải được gọi bên trong <NetworkProvider>');
  }
  return ctx;
}
