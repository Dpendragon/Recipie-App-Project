import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import type { RecipeCardVariant } from './RecipeCard';
import { cardStyles } from './recipeCardStyles';

type Props = { variant?: RecipeCardVariant };

// Thẻ món "đang tải": các khối xám nhấp nháy
export function RecipeCardSkeleton({ variant = 'compact' }: Props) {
  const [pulse] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const lines = (
    <>
      <View style={[styles.block, { width: '30%', height: 10 }]} />
      <View style={[styles.block, { width: '75%', height: 16, marginTop: 10 }]} />
      <View style={[styles.block, { width: '50%', height: 10, marginTop: 10 }]} />
    </>
  );

  if (variant === 'carousel') {
    return (
      <Animated.View style={[cardStyles.card, cardStyles.cardCarousel, { opacity: pulse }]}>
        <View style={[styles.block, cardStyles.imageCarousel]} />
        <View style={styles.carouselText}>
          <View style={[styles.block, { width: '80%', height: 14 }]} />
          <View style={[styles.block, { width: '45%', height: 10, marginTop: 8 }]} />
        </View>
      </Animated.View>
    );
  }

  if (variant === 'large') {
    return (
      <Animated.View style={[cardStyles.card, { opacity: pulse }]}>
        <View style={[styles.block, cardStyles.imageLarge]} />
        <View style={styles.largeText}>{lines}</View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[cardStyles.card, cardStyles.cardRow, { opacity: pulse }]}>
      <View style={[styles.block, cardStyles.imageCompact]} />
      <View style={{ flex: 1 }}>{lines}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 8, backgroundColor: colors.softGreen },
  largeText: { paddingHorizontal: 6, paddingTop: 14, paddingBottom: 8 },
  carouselText: { marginHorizontal: 4, marginTop: 12, marginBottom: 8 },
});
