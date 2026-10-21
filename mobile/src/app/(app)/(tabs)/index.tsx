import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Trang chủ — App Gate đang hoạt động</Text>
      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  text: { textAlign: 'center' },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
