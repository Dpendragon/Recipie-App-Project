import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  checked: boolean;
  onToggle: () => void;
  shape?: 'round' | 'square';
};

export function Checkbox({ checked, onToggle, shape = 'square' }: Props) {
  const isRound = shape === 'round';
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.box,
        {
          borderRadius: isRound ? 16 : 2,
          backgroundColor: isRound ? colors.inputFill : colors.white,
          borderColor: isRound ? 'rgba(222,192,183,0.8)' : 'rgba(138,114,106,0.3)',
        },
        checked ? styles.checked : null,
      ]}
    >
      {checked ? <Text style={styles.tick}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 16,
    height: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: colors.white },
});
