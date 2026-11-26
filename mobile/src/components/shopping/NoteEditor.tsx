import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/common/ActionButton';
import { FormField } from '@/components/common/FormField';
import { appColors, appFonts } from '@/constants/theme';
import type { ShoppingItem } from '@/types/shopping.types';

// Giới hạn trùng với UpdateShoppingItemDto ở backend.
export const NOTE_MAX_LENGTH = 500;

type Props = {
  item: ShoppingItem;
  groupLabel: string;
  // Trả về thông báo lỗi để hiện tại ô nhập, hoặc null nếu lưu thành công.
  onSave: (note: string) => Promise<string | null>;
  onDelete: () => void;
  onCancel: () => void;
};

// Phần mở rộng dưới 1 dòng để nhập / sửa ghi chú.
export function NoteEditor({ item, groupLabel, onSave, onDelete, onCancel }: Props) {
  const [note, setNote] = useState(item.note ?? '');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const overBy = note.trim().length - NOTE_MAX_LENGTH;
  const lengthError =
    overBy > 0
      ? `Ghi chú vượt quá ${NOTE_MAX_LENGTH} ký tự. Vui lòng xoá bớt ${overBy} ký tự.`
      : null;

  const handleSave = async () => {
    if (lengthError) return;
    setSaving(true);
    setServerError(null);
    const error = await onSave(note);
    setSaving(false);
    if (error) setServerError(error);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={2}>
          Sửa ghi chú · {item.name} ({groupLabel})
        </Text>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={styles.headerAction}
          accessibilityRole="button"
        >
          <Text style={styles.deleteText}>Xoá dòng</Text>
        </Pressable>
      </View>

      <FormField
        label="Ghi chú"
        hint={`Tối đa ${NOTE_MAX_LENGTH} ký tự`}
        value={note}
        onChangeText={(text) => {
          setNote(text);
          setServerError(null);
        }}
        placeholder="Ví dụ: chọn loại tươi, mua ở chợ gần nhà…"
        multiline
        autoFocus
        error={lengthError ?? serverError}
        helper={
          lengthError
            ? `${note.trim().length}/${NOTE_MAX_LENGTH} ký tự · vượt giới hạn`
            : `${note.trim().length}/${NOTE_MAX_LENGTH} ký tự`
        }
      />

      <ActionButton
        title="Lưu ghi chú"
        variant="secondary"
        onPress={handleSave}
        loading={saving}
        disabled={lengthError !== null}
      />
      <Pressable onPress={onCancel} hitSlop={8} style={styles.cancel} accessibilityRole="button">
        <Text style={styles.cancelText}>Huỷ chỉnh sửa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    padding: 14,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: { flex: 1, fontFamily: appFonts.semiBold, fontSize: 11, color: appColors.primary },
  headerAction: { minHeight: 44, justifyContent: 'center' },
  deleteText: { fontFamily: appFonts.regular, fontSize: 11, color: appColors.danger },
  cancel: { alignSelf: 'center', paddingVertical: 4 },
  cancelText: { fontFamily: appFonts.regular, fontSize: 12, color: appColors.primary },
});
