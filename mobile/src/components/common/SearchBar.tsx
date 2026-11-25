import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { icons } from '@/constants/assets';
import { Icon } from './Icon';

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void; 
  onPressFilter?: () => void; 
  filterActive?: boolean; 
  onPress?: () => void; 
  autoFocus?: boolean;
};

// Ô tìm kiếm bo tròn
export function SearchBar({
  value = '',
  placeholder = 'Tìm tên món ăn...',
  onChangeText,
  onSubmit,
  onClear,
  onPressFilter,
  filterActive = false,
  onPress,
  autoFocus,
}: Props) {
  const showClear = Boolean(onClear) && value.length > 0;

  const right = showClear ? (
    <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Xoá chữ đã nhập">
      <Icon icon={icons.closeDark} />
    </Pressable>
  ) : onPressFilter ? (
    <Pressable onPress={onPressFilter} hitSlop={10} accessibilityRole="button" accessibilityLabel="Bộ lọc">
      <Icon icon={icons.filter} />
      {filterActive ? <View style={styles.dot} /> : null}
    </Pressable>
  ) : null;

  if (onPress) {
    return (
      <View style={styles.bar}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={placeholder}
          style={styles.pressArea}
        >
          <Icon icon={icons.search} />
          <Text style={styles.placeholder}>{placeholder}</Text>
        </Pressable>
        {right}
      </View>
    );
  }

  return (
    <View style={styles.bar}>
      <Icon icon={icons.search} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        style={styles.input}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressArea: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  placeholder: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textDark,
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
