import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

type Props = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function KeyboardScreen({ children, contentContainerStyle }: Props) {
  const scroll = (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled" 
      automaticallyAdjustKeyboardInsets // chỉ có tác dụng trên iOS
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {Platform.OS === 'android' ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {scroll}
        </KeyboardAvoidingView>
      ) : (
        scroll
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
});
