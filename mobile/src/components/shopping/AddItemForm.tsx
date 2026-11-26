import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/common/ActionButton';
import { FormField } from '@/components/common/FormField';
import { appColors, appFonts } from '@/constants/theme';

// Giới hạn trùng với CreateShoppingItemDto ở backend.
const NAME_MAX_LENGTH = 255;
const QUANTITY_MAX_LENGTH = 100;

type Props = {
  // Trả về thông báo lỗi từ máy chủ, hoặc null nếu thêm thành công.
  onSubmit: (name: string, quantity: string) => Promise<string | null>;
  onCancel: () => void;
};

// Form thêm tay 1 nguyên liệu vào khu vực "Của tôi".
export function AddItemForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedQuantity = quantity.trim();

    // Tên trống thì báo lỗi ngay tại form, chưa gọi API.
    const nextNameError = !trimmedName
      ? 'Vui lòng nhập tên nguyên liệu'
      : trimmedName.length > NAME_MAX_LENGTH
        ? `Tên nguyên liệu tối đa ${NAME_MAX_LENGTH} ký tự`
        : null;
    const nextQuantityError =
      trimmedQuantity.length > QUANTITY_MAX_LENGTH
        ? `Số lượng tối đa ${QUANTITY_MAX_LENGTH} ký tự`
        : null;
    setNameError(nextNameError);
    setQuantityError(nextQuantityError);
    setSubmitError(null);
    if (nextNameError || nextQuantityError) return;

    setSubmitting(true);
    const error = await onSubmit(trimmedName, trimmedQuantity);
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setName('');
    setQuantity('');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Thêm vào “Của tôi”</Text>

      <FormField
        label="Tên nguyên liệu *"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (nameError) setNameError(null);
        }}
        placeholder="Nhập tên nguyên liệu…"
        autoFocus
        returnKeyType="next"
        error={nameError}
      />
      <FormField
        label="Số lượng (không bắt buộc)"
        value={quantity}
        onChangeText={(text) => {
          setQuantity(text);
          if (quantityError) setQuantityError(null);
        }}
        placeholder="Ví dụ: 1 bó, 200 g…"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        error={quantityError}
      />

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <ActionButton title="Thêm vào danh sách" onPress={handleSubmit} loading={submitting} />
      <Pressable onPress={onCancel} hitSlop={8} style={styles.cancel} accessibilityRole="button">
        <Text style={styles.cancelText}>Đóng</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    borderRadius: 18,
    backgroundColor: appColors.primarySoft,
  },
  title: { fontFamily: appFonts.semiBold, fontSize: 15, lineHeight: 22, color: appColors.textDark },
  submitError: { fontFamily: appFonts.regular, fontSize: 12, color: appColors.danger },
  cancel: { alignSelf: 'center', paddingVertical: 4 },
  cancelText: { fontFamily: appFonts.regular, fontSize: 12, color: appColors.primary },
});
