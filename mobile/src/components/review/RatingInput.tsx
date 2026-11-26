import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';

type Props = {
  // 0: chưa chọn; 1–5: số sao đã chọn.
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

const STARS = [1, 2, 3, 4, 5] as const;

// Hàng chọn 1–5 sao: 5 ô 35×35, cách nhau 12. Sao chưa chọn
// là icon viền xám của Figma; sao đã chọn cùng hình, tô vàng #C58A35.
export function RatingInput({ value, onChange, disabled = false }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Chọn số sao">
      {STARS.map((star) => {
        const selected = star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            disabled={disabled}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityLabel={`${star} sao`}
            accessibilityState={{ checked: star === value, disabled }}
            style={({ pressed }) => [styles.star, pressed ? styles.pressed : null]}
          >
            <Icon icon={selected ? icons.starFilled : icons.starOutline} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  star: { width: 35, height: 35 },
  pressed: { opacity: 0.7 },
});
