import { Stack } from 'expo-router';
import { SearchProvider } from '@/contexts/SearchContext';

export default function AppLayout() {
  return (
    <SearchProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SearchProvider>
  );
}
