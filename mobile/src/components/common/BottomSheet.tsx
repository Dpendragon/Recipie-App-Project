import { useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { icons } from '@/constants/assets';
import { Icon } from './Icon';

type Props = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
}>;

// Bảng trượt từ dưới lên
export function BottomSheet({ visible, onClose, title, children }: Props) {
  const { height } = useWindowDimensions();
  // progress: 0 = đã ẩn, 1 = đã hiện hết
  const [progress] = useState(() => new Animated.Value(0));
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setMounted(false);
        },
      );
    }
  }, [visible, progress]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        {/* Vùng mờ: bấm vào để đóng */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: height * 0.9 },
            { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] },
          ]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Đóng">
                <Icon icon={icons.closeDark} />
              </Pressable>
            </View>
          ) : null}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: colors.textDark },
});
