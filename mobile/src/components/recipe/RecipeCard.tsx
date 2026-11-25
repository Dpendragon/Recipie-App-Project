import { Image } from 'expo-image';
import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { colors, fonts } from '@/constants/theme';
import type { RecipeSummary } from '@/types/recipe.types';
import { formatMatch, formatMeta, formatRating, formatSource, resolveImageUrl } from '@/utils/formatters';
import { cardStyles } from './recipeCardStyles';

export type RecipeCardVariant = 'large' | 'compact' | 'carousel';

type Props = {
  recipe: RecipeSummary;
  variant?: RecipeCardVariant;
  onPress?: () => void;
};

export function RecipeCard({ recipe, variant = 'compact', onPress }: Props) {
  const uri = resolveImageUrl(recipe.imageUrl);
  const source = formatSource(recipe.source);
  const rating = formatRating(recipe);
  const match = formatMatch(recipe);
  const meta = formatMeta(recipe);

  const label = [recipe.title, source].join(', ');

  if (variant === 'carousel') {
    const minutes = recipe.readyInMinutes !== null ? `${recipe.readyInMinutes} phút` : null;
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[cardStyles.card, cardStyles.cardCarousel]}
      >
        <RecipeImage key={uri} uri={uri} style={cardStyles.imageCarousel}>
          <HeartBadge active={recipe.isFavorite} small />
        </RecipeImage>
        <Text style={styles.carouselTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <Text style={styles.carouselMeta} numberOfLines={1}>
          {rating ? <Text style={styles.star}>★ {rating}</Text> : null}
          {rating && minutes ? ' · ' : ''}
          {minutes}
        </Text>
      </Pressable>
    );
  }

  const isLarge = variant === 'large';
  const textBlock = (
    <>
      <View style={styles.sourceRow}>
        <Text style={styles.source}>{source}</Text>
        {rating ? <Text style={styles.star}>★ {rating}</Text> : null}
      </View>
      <Text style={isLarge ? styles.titleLarge : styles.titleCompact} numberOfLines={2}>
        {recipe.title}
      </Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {match ? <Text style={styles.match}>{match}</Text> : null}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[cardStyles.card, isLarge ? null : cardStyles.cardRow]}
    >
      {isLarge ? (
        <>
          <RecipeImage key={uri} uri={uri} style={cardStyles.imageLarge}>
            <HeartBadge active={recipe.isFavorite} />
          </RecipeImage>
          <View style={styles.bodyLarge}>{textBlock}</View>
        </>
      ) : (
        <>
          <RecipeImage key={uri} uri={uri} style={cardStyles.imageCompact} />
          <View style={styles.bodyCompact}>{textBlock}</View>
        </>
      )}
    </Pressable>
  );
}

// Ảnh món. Chưa có ảnh hoặc ảnh lỗi thì hiện khung xanh nhạt với biểu tượng dao nĩa.
function RecipeImage({ uri, style, children }: PropsWithChildren<{ uri: string | null; style: StyleProp<ViewStyle> }>) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.imageBox, style]}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon icon={icons.utensils} />
      )}
      {children}
    </View>
  );
}

// Nút tim tròn ở góc ảnh
function HeartBadge({ active, small = false }: { active: boolean; small?: boolean }) {
  return (
    <View
      accessible
      accessibilityLabel={active ? 'Đã yêu thích' : 'Chưa yêu thích'}
      style={[styles.heart, small ? styles.heartSmall : null]}
    >
      <Icon
        icon={active ? icons.heartFilled : icons.heart}
        style={small ? { width: 15, height: 15 } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageBox: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  heartSmall: { top: 8, right: 8, width: 30, height: 30, borderRadius: 15 },

  bodyLarge: { paddingHorizontal: 6, paddingTop: 12, paddingBottom: 6 },
  bodyCompact: { flex: 1 },
  sourceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  source: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: colors.textMuted },
  star: { fontFamily: fonts.semiBold, fontSize: 11.5, color: colors.star },
  titleLarge: { marginTop: 6, fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, color: colors.textDark },
  titleCompact: { marginTop: 4, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.textDark },
  meta: { marginTop: 6, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },
  match: { marginTop: 6, fontFamily: fonts.bold, fontSize: 12.5, lineHeight: 18, color: colors.primary },

  carouselTitle: {
    marginTop: 10,
    marginHorizontal: 4,
    fontFamily: fonts.bold,
    fontSize: 14.5,
    lineHeight: 19,
    color: colors.textDark,
  },
  carouselMeta: {
    marginTop: 5,
    marginBottom: 6,
    marginHorizontal: 4,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
});
