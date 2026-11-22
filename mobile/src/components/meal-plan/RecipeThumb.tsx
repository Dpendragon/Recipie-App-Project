import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { appColors } from '@/constants/theme';

type Props = {
  imageUrl: string | null;
  width: number;
  height: number;
  radius: number;
};

// Ảnh món; công thức không có ảnh thì hiện ô xanh nhạt với icon salad.
export function RecipeThumb({ imageUrl, width, height, radius }: Props) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width, height, borderRadius: radius }}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={[styles.placeholder, { width, height, borderRadius: radius }]}>
      <Icon icon={icons.salad} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
