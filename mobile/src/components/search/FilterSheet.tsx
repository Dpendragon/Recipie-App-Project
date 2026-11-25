import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { DIET_OPTIONS, EMPTY_FILTERS, TIME_OPTIONS, TYPE_OPTIONS } from '@/constants/searchFilters';
import { colors, fonts } from '@/constants/theme';
import { useSearch } from '@/hooks/useSearch';
import type { SearchFilters } from '@/types/recipe.types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Bảng "Lọc món"
export function FilterSheet({ visible, onClose }: Props) {
  const { filters, setFilters } = useSearch();
  const [draft, setDraft] = useState<SearchFilters>(filters);

  // Mỗi lần mở bảng: bắt đầu lại từ bộ lọc đang áp dụng
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  function apply() {
    setFilters(draft);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Lọc món">
      <OptionGroup
        title="Chế độ ăn"
        options={DIET_OPTIONS}
        value={draft.diet}
        onChange={(diet) => setDraft((d) => ({ ...d, diet }))}
      />
      <OptionGroup
        title="Thời gian nấu"
        options={TIME_OPTIONS}
        value={draft.maxReadyTime}
        onChange={(maxReadyTime) => setDraft((d) => ({ ...d, maxReadyTime }))}
      />
      <OptionGroup
        title="Loại món"
        options={TYPE_OPTIONS}
        value={draft.type}
        onChange={(type) => setDraft((d) => ({ ...d, type }))}
      />

      <View style={styles.footer}>
        <View style={styles.resetButton}>
          <Button title="Đặt lại" variant="soft" onPress={() => setDraft(EMPTY_FILTERS)} />
        </View>
        <View style={styles.applyButton}>
          <Button title="Áp dụng bộ lọc" onPress={apply} />
        </View>
      </View>
    </BottomSheet>
  );
}

// Một nhóm lựa chọn (chọn đúng 1 trong các chip)
function OptionGroup<T>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            size="lg"
            variant={option.value === value ? 'selected' : 'default'}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupTitle: { marginTop: 24, marginBottom: 12, fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, color: colors.textDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 28 },
  resetButton: { flex: 0.8 },
  applyButton: { flex: 1.2 },
});
