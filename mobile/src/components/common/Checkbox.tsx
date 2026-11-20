import { Pressable } from 'react-native';
import { icons } from '@/constants/assets';
import { Icon } from './Icon';

type Props = {
  checked: boolean;
  onToggle: () => void;
};

export function Checkbox({ checked, onToggle }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <Icon icon={checked ? icons.squareCheck : icons.square} />
    </Pressable>
  );
}
