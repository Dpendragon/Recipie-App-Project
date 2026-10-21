import { Image } from 'expo-image';
import type { StyleProp } from 'react-native';
import type { ImageStyle } from 'expo-image';
import type { IconAsset } from '@/constants/assets';

type Props = {
  icon: IconAsset;
  style?: StyleProp<ImageStyle>;
};

export function Icon({ icon, style }: Props) {
  return (
    <Image
      source={icon.source}
      style={[{ width: icon.width, height: icon.height }, style]}
      contentFit="contain"
    />
  );
}
