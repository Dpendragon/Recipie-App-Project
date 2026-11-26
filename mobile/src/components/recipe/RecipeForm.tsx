import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ActionButton } from '@/components/common/ActionButton';
import { Icon } from '@/components/common/Icon';
import { Notice } from '@/components/common/Notice';
import { TagChips } from '@/components/recipe/TagChips';
import { icons } from '@/constants/assets';
import { extraColors } from '@/constants/layout';
import { DIET_TAGS, DISH_TYPE_TAGS } from '@/constants/recipeTags';
import { colors, fonts, radius } from '@/constants/theme';
import { autocomplete } from '@/services/api/ingredientApi';
import { uploadImage } from '@/services/api/mediaApi';
import type { IngredientSuggestion } from '@/types/ingredient.types';
import type { RecipeIngredientInput } from '@/types/recipe.types';

// Form dùng chung cho "Đăng công thức mới" và "Chỉnh sửa công thức", gồm
// trạng thái đang gửi, khối "Ảnh món ăn", bảng chọn nguồn ảnh và thông báo
// tải ảnh thất bại.

// Một dòng nguyên liệu khi đang soạn: giữ nguyên chuỗi người dùng gõ, chỉ đổi
// sang số lúc gửi. key để React giữ đúng ô khi thêm/xoá giữa danh sách.
export type IngredientDraft = {
  key: string;
  nameVi: string;
  nameEn: string;
  quantity: string;
  unit: string;
};

export type StepDraft = { key: string; text: string };

export type RecipeFormValue = {
  title: string;
  servings: string;
  readyInMinutes: string;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
  videoUrl: string;
  // Chế độ ăn và loại món đã chọn (value tiếng Anh, xem constants/recipeTags).
  diets: string[];
  dishTypes: string[];
  // Ảnh đã lưu trên server (chế độ sửa); null khi công thức chưa có ảnh.
  imageUrl: string | null;
};

// Dữ liệu đã kiểm tra và chuẩn hoá, màn hình gọi API dựng body từ đây. Hai
// trường null là "người dùng để trống": POST bỏ qua, PATCH gửi null để xoá.
export type RecipeFormSubmit = {
  title: string;
  servings: number;
  readyInMinutes: number | null;
  steps: string[];
  videoUrl: string | null;
  // Không chọn gì thì là mảng rỗng: cả hai trường đều không bắt buộc (UC-07).
  diets: string[];
  dishTypes: string[];
  ingredients: RecipeIngredientInput[];
  // undefined: giữ nguyên ảnh cũ (không chọn ảnh mới, hoặc upload thất bại).
  // string: ảnh vừa tải lên. null: người dùng đã bấm "Gỡ ảnh".
  imageUrl: string | null | undefined;
  // true khi có ảnh mới nhưng tải lên hỏng: màn hình lưu công thức xong thì
  // phải ở lại và báo thiếu ảnh.
  imageUploadFailed: boolean;
};

type FormErrors = {
  title?: string;
  servings?: string;
  readyInMinutes?: string;
  ingredients?: string;
  steps?: string;
  videoUrl?: string;
  // Lỗi của từng dòng nguyên liệu, tra theo key của dòng.
  rows?: Record<string, string>;
};

type Props = {
  // 'create': đăng mới; 'edit': sửa món đã đăng (hiện banner nhắc ở đầu form).
  mode: 'create' | 'edit';
  initialValue?: RecipeFormValue;
  submitting: boolean;
  // Lỗi server trả về khi gửi.
  submitError: string | null;
  // Công thức đã lưu xong nhưng ảnh tải lên thất bại: màn hình truyền hàm mở
  // công thức vừa lưu, form hiện thông báo kèm nút "Xem công thức". Bỏ trống
  // khi chưa gặp trường hợp này.
  onViewSaved?: () => void;
  onSubmit: (value: RecipeFormSubmit) => void;
};

// Giới hạn của CreateRecipeDto: gửi quá sẽ bị 400, chặn trước tại form.
const TITLE_MAX = 255;
const NAME_MAX = 255;
const UNIT_MAX = 50;
const URL_MAX = 500;

// Gợi ý nguyên liệu: chờ người dùng ngừng gõ rồi mới gọi API, và chỉ gọi từ 2
// ký tự trở lên để không hỏi server với mỗi chữ cái đầu.
const SUGGEST_DEBOUNCE_MS = 300;
const SUGGEST_MIN_LENGTH = 2;
const SUGGEST_LIMIT = 5;

// Ảnh gửi lên backend tối đa 5 MB và chỉ nhận JPEG/PNG/WebP: nén bớt ngay lúc
// chọn để ảnh gốc từ máy ảnh điện thoại không bị từ chối.
const IMAGE_QUALITY = 0.8;

// Upload hỏng thì công thức vẫn được lưu, chỉ tạm thời chưa có ảnh; người
// dùng bổ sung sau bằng cách sửa công thức.
const IMAGE_FAILED_MESSAGE = 'Công thức vẫn được lưu, bạn có thể thêm ảnh sau';
const IMAGE_PICK_FAILED_MESSAGE = 'Không mở được thư viện ảnh. Vui lòng thử lại.';
const CAMERA_DENIED_MESSAGE =
  'Bạn chưa cho phép dùng máy ảnh. Hãy bật quyền máy ảnh trong Cài đặt, hoặc chọn ảnh từ thư viện.';
const CAMERA_FAILED_MESSAGE = 'Không mở được máy ảnh. Vui lòng thử lại.';

let keySeed = 0;

function nextKey(prefix: string): string {
  keySeed += 1;
  return `${prefix}-${keySeed}`;
}

export function emptyIngredient(): IngredientDraft {
  return { key: nextKey('ing'), nameVi: '', nameEn: '', quantity: '', unit: '' };
}

export function emptyStep(): StepDraft {
  return { key: nextKey('step'), text: '' };
}

export function createEmptyRecipeForm(): RecipeFormValue {
  return {
    title: '',
    servings: '',
    readyInMinutes: '',
    ingredients: [emptyIngredient()],
    steps: [emptyStep()],
    videoUrl: '',
    diets: [],
    dishTypes: [],
    imageUrl: null,
  };
}

// Số lượng nhận cả "1,5" lẫn "1.5" vì bàn phím tiếng Việt quen dấu phẩy.
function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

function parseCount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value >= 1 ? value : null;
}

function isBlankIngredient(row: IngredientDraft): boolean {
  return !row.nameVi.trim() && !row.nameEn.trim() && !row.quantity.trim() && !row.unit.trim();
}

export function RecipeForm({
  mode,
  initialValue,
  submitting,
  submitError,
  onViewSaved,
  onSubmit,
}: Props) {
  const [value, setValue] = useState<RecipeFormValue>(() => initialValue ?? createEmptyRecipeForm());
  const [errors, setErrors] = useState<FormErrors>({});

  // Ảnh vừa chọn từ thư viện, chưa tải lên: chỉ upload khi bấm Đăng/Lưu.
  const [localUri, setLocalUri] = useState<string | null>(null);
  // Ảnh công thức đang có trên server lúc mở form, để biết "Gỡ ảnh" có cần gửi
  // null hay không (POST không nhận null, chỉ PATCH mới xoá được ảnh cũ).
  const [savedImageUrl] = useState<string | null>(() => initialValue?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  // Bảng "Chọn ảnh" trượt từ dưới lên.
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);

  const isEdit = mode === 'edit';
  // Trong lúc tải ảnh lên, form cũng phải khoá như khi đang gửi công thức.
  const busy = submitting || uploading;
  const faded = busy ? styles.faded : null;
  const previewUri = localUri ?? value.imageUrl;
  // Công thức mới đã lưu xong rồi thì không cho đăng lần hai: ẩn nút gửi. Chế
  // độ sửa vẫn giữ nút để người dùng lưu lại, tức thử tải ảnh thêm lần nữa.
  const canSubmit = isEdit || !onViewSaved;

  const patch = (next: Partial<RecipeFormValue>) => setValue((current) => ({ ...current, ...next }));

  const patchIngredient = (key: string, next: Partial<IngredientDraft>) => {
    setValue((current) => ({
      ...current,
      ingredients: current.ingredients.map((row) => (row.key === key ? { ...row, ...next } : row)),
    }));
  };

  const removeIngredient = (key: string) => {
    setValue((current) => ({
      ...current,
      ingredients: current.ingredients.filter((row) => row.key !== key),
    }));
  };

  // Chạm chip để chọn hoặc bỏ chọn; giữ nguyên thứ tự trong constants/recipeTags.
  const toggleTag = (field: 'diets' | 'dishTypes', tag: string) => {
    setValue((current) => ({
      ...current,
      [field]: current[field].includes(tag)
        ? current[field].filter((item) => item !== tag)
        : [...current[field], tag],
    }));
  };

  const patchStep = (key: string, text: string) => {
    setValue((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.key === key ? { ...step, text } : step)),
    }));
  };

  const removeStep = (key: string) => {
    setValue((current) => ({ ...current, steps: current.steps.filter((step) => step.key !== key) }));
  };

  // Kết quả chung của hai nguồn ảnh: người dùng bấm huỷ thì giữ nguyên ảnh cũ.
  const applyPicked = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    setImageNotice(null);
    setLocalUri(asset.uri);
  };

  // "Chọn từ thư viện": launchImageLibraryAsync không cần
  // xin quyền trước với ảnh.
  const pickFromLibrary = async () => {
    setSourceSheetOpen(false);
    if (busy) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: IMAGE_QUALITY,
      });
      applyPicked(result);
    } catch {
      setImageNotice(IMAGE_PICK_FAILED_MESSAGE);
    }
  };

  // "Chụp ảnh": máy ảnh bắt buộc phải xin quyền trước. Từ
  // chối thì chỉ báo lại và ở nguyên form, người dùng vẫn chọn được từ thư viện.
  const takePhoto = async () => {
    setSourceSheetOpen(false);
    if (busy) return;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setImageNotice(CAMERA_DENIED_MESSAGE);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: IMAGE_QUALITY,
      });
      applyPicked(result);
    } catch {
      setImageNotice(CAMERA_FAILED_MESSAGE);
    }
  };

  // "Gỡ ảnh": bỏ cả ảnh vừa chọn lẫn ảnh cũ trên server.
  const removeImage = () => {
    if (busy) return;
    setImageNotice(null);
    setLocalUri(null);
    patch({ imageUrl: null });
  };

  // Ảnh chỉ tải lên ngay trước khi tạo/cập nhật công thức. imageUrl là giá trị
  // gửi kèm body (undefined là "không đụng tới ảnh hiện có"); uploadFailed để
  // màn hình biết công thức lưu xong nhưng còn thiếu ảnh.
  const resolveImageUrl = async (): Promise<{
    imageUrl: string | null | undefined;
    uploadFailed: boolean;
  }> => {
    if (localUri) {
      setUploading(true);
      try {
        return { imageUrl: await uploadImage(localUri), uploadFailed: false };
      } catch {
        // Vẫn lưu công thức, chỉ là chưa có ảnh mới.
        return { imageUrl: undefined, uploadFailed: true };
      } finally {
        setUploading(false);
      }
    }
    // Người dùng đã gỡ ảnh cũ: chỉ PATCH mới xoá được (savedImageUrl khác null).
    if (value.imageUrl === null && savedImageUrl !== null) {
      return { imageUrl: null, uploadFailed: false };
    }
    return { imageUrl: undefined, uploadFailed: false };
  };

  // Thiếu tên món, số người ăn hoặc nguyên liệu thì báo
  // lỗi ngay tại form, không gọi API. Các kiểm tra còn lại bám theo CreateRecipeDto.
  const submit = async () => {
    if (busy) return;

    const found: FormErrors = {};
    const rows: Record<string, string> = {};

    const title = value.title.trim();
    if (!title) found.title = 'Nhập tên công thức';
    else if (title.length > TITLE_MAX) found.title = `Tên công thức tối đa ${TITLE_MAX} ký tự`;

    const servings = parseCount(value.servings);
    if (!value.servings.trim()) found.servings = 'Nhập số người ăn';
    else if (servings === null) found.servings = 'Số người ăn phải là số nguyên từ 1 trở lên';

    const minutesText = value.readyInMinutes.trim();
    const minutes = minutesText ? parseCount(minutesText) : null;
    if (minutesText && minutes === null) {
      found.readyInMinutes = 'Thời gian phải là số nguyên từ 1 phút trở lên';
    }

    // Dòng trống hoàn toàn chỉ là chỗ nhập còn thừa, bỏ qua; dòng đã nhập dở
    // thì bắt buộc có tên tiếng Việt.
    const filledRows = value.ingredients.filter((row) => !isBlankIngredient(row));
    const ingredients: RecipeIngredientInput[] = [];
    for (const row of filledRows) {
      const nameVi = row.nameVi.trim();
      const nameEn = row.nameEn.trim();
      const unit = row.unit.trim();
      const quantityText = row.quantity.trim();
      const quantity = quantityText ? parseAmount(quantityText) : null;

      if (!nameVi) rows[row.key] = 'Nhập tên nguyên liệu tiếng Việt';
      else if (nameVi.length > NAME_MAX) rows[row.key] = `Tên nguyên liệu tối đa ${NAME_MAX} ký tự`;
      else if (nameEn.length > NAME_MAX) rows[row.key] = `Tên tiếng Anh tối đa ${NAME_MAX} ký tự`;
      else if (quantityText && quantity === null) rows[row.key] = 'Số lượng phải là số không âm';
      else if (unit.length > UNIT_MAX) rows[row.key] = `Đơn vị tối đa ${UNIT_MAX} ký tự`;
      else {
        const ingredient: RecipeIngredientInput = { nameVi };
        if (nameEn) ingredient.nameEn = nameEn;
        if (quantity !== null) ingredient.quantity = quantity;
        if (unit) ingredient.unit = unit;
        ingredients.push(ingredient);
      }
    }
    if (filledRows.length === 0) found.ingredients = 'Thêm ít nhất 1 nguyên liệu';

    const steps = value.steps.map((step) => step.text.trim()).filter(Boolean);
    if (steps.length === 0) found.steps = 'Thêm ít nhất 1 bước thực hiện';

    const videoUrl = value.videoUrl.trim();
    if (videoUrl && !/^https?:\/\/\S+$/i.test(videoUrl)) {
      found.videoUrl = 'Liên kết video phải bắt đầu bằng http:// hoặc https://';
    } else if (videoUrl.length > URL_MAX) {
      found.videoUrl = `Liên kết video tối đa ${URL_MAX} ký tự`;
    }

    if (Object.keys(rows).length > 0) found.rows = rows;
    if (Object.keys(found).length > 0 || servings === null) {
      setErrors(found);
      return;
    }

    setErrors({});
    const image = await resolveImageUrl();
    onSubmit({
      title,
      servings,
      readyInMinutes: minutes,
      steps,
      videoUrl: videoUrl || null,
      diets: value.diets,
      dishTypes: value.dishTypes,
      ingredients,
      imageUrl: image.imageUrl,
      imageUploadFailed: image.uploadFailed,
    });
  };

  return (
    <View style={styles.form}>
      {/* Đã lưu nhưng ảnh hỏng: ở lại màn, tự bấm để xem. */}
      {onViewSaved ? (
        <View style={styles.savedNotice}>
          <Text style={styles.savedNoticeText}>{IMAGE_FAILED_MESSAGE}</Text>
          <ActionButton title="Xem công thức" variant="secondary" onPress={onViewSaved} />
        </View>
      ) : null}

      {imageNotice ? <Notice variant="warning" message={imageNotice} /> : null}

      {isEdit ? (
        <Notice
          variant="success"
          icon={icons.formPencil}
          message="Đang sửa món đã đăng. Các thay đổi chỉ hiển thị sau khi bạn lưu."
        />
      ) : null}

      <View style={styles.imageBlock}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Ảnh món ăn</Text>
          <Text style={styles.sectionMeta}>Không bắt buộc</Text>
        </View>

        {/* Chạm vùng ảnh để mở bảng chọn nguồn ảnh. */}
        <Pressable
          onPress={() => setSourceSheetOpen(true)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={previewUri ? 'Đổi ảnh món ăn' : 'Chọn ảnh món ăn'}
          style={({ pressed }) => [
            styles.preview,
            previewUri ? null : styles.previewEmpty,
            faded,
            pressed ? styles.pressed : null,
          ]}
        >
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              contentFit="cover"
              accessibilityLabel="Ảnh món ăn đã chọn"
            />
          ) : (
            <>
              <Text style={styles.previewEmptyText}>Chọn ảnh món ăn</Text>
              <Text style={styles.previewEmptyHint}>JPEG, PNG hoặc WebP, tối đa 5 MB</Text>
            </>
          )}
        </Pressable>

        <View style={styles.imageActions}>
          <Pressable
            onPress={() => void pickFromLibrary()}
            disabled={busy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={previewUri ? 'Chọn ảnh khác từ thư viện' : 'Chọn ảnh từ thư viện'}
          >
            <Text style={[styles.imageLink, faded]}>Chọn ảnh từ thư viện</Text>
          </Pressable>
          {previewUri ? (
            <Pressable
              onPress={removeImage}
              disabled={busy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Gỡ ảnh món ăn"
            >
              <Text style={[styles.imageRemove, faded]}>Gỡ ảnh</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.general}>
        <View style={[styles.field, faded]}>
          <Text style={styles.label}>Tên công thức *</Text>
          <View style={[styles.inputBox, errors.title ? styles.inputBoxError : null]}>
            <TextInput
              value={value.title}
              onChangeText={(text) => patch({ title: text })}
              placeholder="Ví dụ: Đậu hũ sốt cà chua"
              placeholderTextColor={colors.textMid}
              editable={!busy}
              maxLength={TITLE_MAX}
              accessibilityLabel="Tên công thức, bắt buộc"
              style={styles.input}
            />
          </View>
          {errors.title ? <FieldError message={errors.title} /> : null}
        </View>

        <View style={styles.pairRow}>
          <View style={[styles.pairItem, faded]}>
            <Text style={styles.label}>Số người ăn *</Text>
            <View style={[styles.inputBox, errors.servings ? styles.inputBoxError : null]}>
              <TextInput
                value={value.servings}
                onChangeText={(text) => patch({ servings: text })}
                placeholder="2"
                placeholderTextColor={colors.textMid}
                keyboardType="number-pad"
                editable={!busy}
                maxLength={3}
                accessibilityLabel="Số người ăn, bắt buộc"
                style={styles.input}
              />
              <Icon icon={icons.formServings} />
            </View>
            {errors.servings ? <FieldError message={errors.servings} /> : null}
          </View>

          <View style={[styles.pairItem, faded]}>
            <Text style={styles.label}>Thời gian (phút)</Text>
            <View style={[styles.inputBox, errors.readyInMinutes ? styles.inputBoxError : null]}>
              <TextInput
                value={value.readyInMinutes}
                onChangeText={(text) => patch({ readyInMinutes: text })}
                placeholder="20"
                placeholderTextColor={colors.textMid}
                keyboardType="number-pad"
                editable={!busy}
                maxLength={4}
                accessibilityLabel="Thời gian nấu tính bằng phút, không bắt buộc"
                style={styles.input}
              />
              <Icon icon={icons.formMinutes} />
            </View>
            {errors.readyInMinutes ? <FieldError message={errors.readyInMinutes} /> : null}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Nguyên liệu *</Text>
          <Text style={styles.sectionMeta}>{`${value.ingredients.length} nguyên liệu`}</Text>
        </View>
        <Text style={styles.hint}>
          Tên tiếng Việt là bắt buộc. Tên tiếng Anh không bắt buộc, giúp ước tính dinh dưỡng tốt
          hơn.
        </Text>

        {value.ingredients.map((row, index) => (
          <IngredientRow
            key={row.key}
            row={row}
            index={index}
            error={errors.rows?.[row.key] ?? null}
            submitting={busy}
            canRemove={value.ingredients.length > 1}
            onChange={(next) => patchIngredient(row.key, next)}
            onRemove={() => removeIngredient(row.key)}
          />
        ))}
        {errors.ingredients ? <FieldError message={errors.ingredients} /> : null}

        <ActionButton
          title="Thêm nguyên liệu"
          variant="secondary"
          icon={icons.formPlus}
          disabled={busy}
          onPress={() =>
            setValue((current) => ({
              ...current,
              ingredients: [...current.ingredients, emptyIngredient()],
            }))
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Các bước thực hiện *</Text>

        {value.steps.map((step, index) => (
          <View key={step.key} style={[styles.stepCard, faded]}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{`Bước ${index + 1}`}</Text>
              {value.steps.length > 1 ? (
                <Pressable
                  onPress={() => removeStep(step.key)}
                  disabled={busy}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Xoá bước ${index + 1}`}
                >
                  <Icon icon={icons.formTrash} />
                </Pressable>
              ) : null}
            </View>
            <TextInput
              value={step.text}
              onChangeText={(text) => patchStep(step.key, text)}
              placeholder="Mô tả việc cần làm ở bước này"
              placeholderTextColor={colors.textMid}
              multiline
              textAlignVertical="top"
              editable={!busy}
              accessibilityLabel={`Nội dung bước ${index + 1}`}
              style={styles.stepInput}
            />
          </View>
        ))}
        {errors.steps ? <FieldError message={errors.steps} /> : null}

        <ActionButton
          title="Thêm bước thực hiện"
          variant="secondary"
          icon={icons.formPlus}
          disabled={busy}
          onPress={() => setValue((current) => ({ ...current, steps: [...current.steps, emptyStep()] }))}
        />
      </View>

      <View style={[styles.field, faded]}>
        <Text style={styles.label}>Liên kết video (không bắt buộc)</Text>
        <View style={[styles.inputBox, errors.videoUrl ? styles.inputBoxError : null]}>
          <TextInput
            value={value.videoUrl}
            onChangeText={(text) => patch({ videoUrl: text })}
            placeholder="Dán liên kết YouTube hoặc video hướng dẫn"
            placeholderTextColor={colors.textMid}
            autoCapitalize="none"
            keyboardType="url"
            editable={!busy}
            maxLength={URL_MAX}
            accessibilityLabel="Liên kết video hướng dẫn, không bắt buộc"
            style={styles.input}
          />
          <Icon icon={icons.formLink} />
        </View>
        {errors.videoUrl ? <FieldError message={errors.videoUrl} /> : null}
      </View>

      {/* Hai nhóm chip không bắt buộc, để UC-07 lọc được công thức LOCAL. */}
      <View style={faded}>
        <TagChips
          label="Chế độ ăn"
          options={DIET_TAGS}
          selected={value.diets}
          disabled={busy}
          onToggle={(tag) => toggleTag('diets', tag)}
        />
      </View>

      <View style={faded}>
        <TagChips
          label="Loại món"
          options={DISH_TYPE_TAGS}
          selected={value.dishTypes}
          disabled={busy}
          onToggle={(tag) => toggleTag('dishTypes', tag)}
        />
      </View>

      <Notice
        variant="warning"
        icon={icons.formSalad}
        title="Chưa ước tính được dinh dưỡng"
        message="Bạn vẫn có thể đăng công thức. Dữ liệu dinh dưỡng chỉ hiển thị khi có đủ thông tin và luôn là ước tính."
      />

      <Text style={styles.hint}>
        * Bắt buộc: tên món, số người ăn, ít nhất 1 nguyên liệu và 1 bước thực hiện.
      </Text>

      <Notice variant="error" message={submitError} />

      {busy ? (
        <View style={styles.busyButton} accessibilityLabel={isEdit ? 'Đang lưu' : 'Đang đăng'}>
          <ActivityIndicator color={colors.white} />
          <Text style={styles.busyText}>
            {uploading ? 'Đang tải ảnh lên…' : isEdit ? 'Đang lưu…' : 'Đang đăng…'}
          </Text>
        </View>
      ) : canSubmit ? (
        <ActionButton
          title={isEdit ? 'Lưu thay đổi' : 'Đăng công thức'}
          icon={icons.toastCheck}
          onPress={() => void submit()}
        />
      ) : null}

      {/* Bảng chọn nguồn ảnh. */}
      <Modal
        visible={sourceSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSourceSheetOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSourceSheetOpen(false)}
            accessibilityLabel="Đóng bảng chọn ảnh"
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHandle}>
              <View style={styles.sheetHandleBar} />
            </View>
            <Text style={styles.sheetTitle}>Chọn ảnh</Text>
            <View>
              <Pressable
                onPress={() => void takePhoto()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.sheetOption, pressed ? styles.pressed : null]}
              >
                <Text style={styles.sheetOptionText}>Chụp ảnh</Text>
              </Pressable>
              <Pressable
                onPress={() => void pickFromLibrary()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.sheetOption, pressed ? styles.pressed : null]}
              >
                <Text style={styles.sheetOptionText}>Chọn từ thư viện</Text>
              </Pressable>
            </View>
            <ActionButton
              title="Hủy"
              variant="secondary"
              onPress={() => setSourceSheetOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <Text style={styles.error} accessibilityRole="alert">
      {message}
    </Text>
  );
}

type IngredientRowProps = {
  row: IngredientDraft;
  index: number;
  error: string | null;
  submitting: boolean;
  canRemove: boolean;
  onChange: (next: Partial<IngredientDraft>) => void;
  onRemove: () => void;
};

// Một dòng nguyên liệu: tên tiếng Việt (bắt buộc) kèm gợi ý từ danh mục chuẩn,
// số lượng và đơn vị không bắt buộc, ô tên tiếng Anh ở hàng dưới.
function IngredientRow({
  row,
  index,
  error,
  submitting,
  canRemove,
  onChange,
  onRemove,
}: IngredientRowProps) {
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  // Chỉ hỏi gợi ý khi người dùng đang gõ ở ô tên; chọn một gợi ý thì đóng lại.
  const [suggesting, setSuggesting] = useState(false);

  const query = row.nameVi.trim();

  useEffect(() => {
    if (!suggesting || query.length < SUGGEST_MIN_LENGTH) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await autocomplete(query, SUGGEST_LIMIT);
        if (!cancelled) setSuggestions(result);
      } catch {
        // Gợi ý chỉ là tiện ích: lỗi mạng thì ẩn danh sách, người dùng vẫn tự gõ được.
        if (!cancelled) setSuggestions([]);
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, suggesting]);

  // Chọn gợi ý: điền tên tiếng Việt và tên tiếng Anh để backend đối chiếu được
  // dinh dưỡng; đơn vị thường dùng chỉ điền khi người dùng chưa nhập đơn vị.
  const pick = (suggestion: IngredientSuggestion) => {
    setSuggesting(false);
    setSuggestions([]);
    onChange({
      nameVi: suggestion.nameVi,
      nameEn: suggestion.nameEn,
      unit: row.unit.trim() ? row.unit : (suggestion.commonUnit ?? ''),
    });
  };

  return (
    <View style={[styles.ingredientCard, submitting ? styles.faded : null]}>
      <View style={styles.ingredientTop}>
        <TextInput
          value={row.nameVi}
          onChangeText={(text) => {
            setSuggesting(true);
            onChange({ nameVi: text });
          }}
          onBlur={() => setSuggesting(false)}
          placeholder="Tên nguyên liệu"
          placeholderTextColor={colors.textMid}
          editable={!submitting}
          maxLength={NAME_MAX}
          accessibilityLabel={`Tên nguyên liệu ${index + 1}, bắt buộc`}
          style={[styles.rowInput, styles.nameInput]}
        />
        <TextInput
          value={row.quantity}
          onChangeText={(text) => onChange({ quantity: text })}
          placeholder="SL"
          placeholderTextColor={colors.textMid}
          keyboardType="decimal-pad"
          editable={!submitting}
          maxLength={8}
          accessibilityLabel={`Số lượng nguyên liệu ${index + 1}, không bắt buộc`}
          style={[styles.rowInput, styles.quantityInput]}
        />
        <TextInput
          value={row.unit}
          onChangeText={(text) => onChange({ unit: text })}
          placeholder="Đơn vị"
          placeholderTextColor={colors.textMid}
          editable={!submitting}
          maxLength={UNIT_MAX}
          accessibilityLabel={`Đơn vị nguyên liệu ${index + 1}, không bắt buộc`}
          style={[styles.rowInput, styles.unitInput]}
        />
        {canRemove ? (
          <Pressable
            onPress={onRemove}
            disabled={submitting}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Xoá nguyên liệu ${index + 1}`}
          >
            <Icon icon={icons.formTrash} />
          </Pressable>
        ) : null}
      </View>

      {suggesting && suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              onPress={() => pick(suggestion)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.suggestion, pressed ? styles.pressed : null]}
            >
              <Text style={styles.suggestionName}>{suggestion.nameVi}</Text>
              <Text style={styles.suggestionMeta}>{suggestion.nameEn}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.enRow}>
        <Text style={styles.enLabel}>EN · tùy chọn</Text>
        <TextInput
          value={row.nameEn}
          onChangeText={(text) => onChange({ nameEn: text })}
          placeholder="Tên tiếng Anh"
          placeholderTextColor={colors.textMid}
          autoCapitalize="none"
          editable={!submitting}
          maxLength={NAME_MAX}
          accessibilityLabel={`Tên tiếng Anh của nguyên liệu ${index + 1}, không bắt buộc`}
          style={styles.enInput}
        />
      </View>

      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 22 },
  // Trạng thái đang gửi: các ô nhập mờ 40%.
  faded: { opacity: 0.4 },

  general: { gap: 16 },
  field: { gap: 7 },
  pairRow: { flexDirection: 'row', gap: 12 },
  pairItem: { flex: 1, gap: 7 },
  label: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textDark },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputBoxError: { borderColor: colors.error },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
  },
  error: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.error },

  section: { gap: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.textDark },
  sectionMeta: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
  hint: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.textMid },

  // Khối "Ảnh món ăn": ảnh xem trước 215 px, bên dưới là hàng hành động
  // chọn ảnh / gỡ ảnh.
  imageBlock: { gap: 12 },
  preview: {
    width: '100%',
    height: 215,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: extraColors.fieldSoft,
  },
  previewImage: { width: '100%', height: '100%' },
  previewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  previewEmptyText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textMid },
  previewEmptyHint: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  imageActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  imageLink: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
  imageRemove: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textMuted },

  // Thông báo "đã lưu nhưng chưa có ảnh" kèm nút mở công thức.
  savedNotice: {
    gap: 10,
    padding: 14,
    borderRadius: radius.input,
    backgroundColor: extraColors.warningBg,
  },
  savedNoticeText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: extraColors.warningText,
  },

  // Bảng chọn nguồn ảnh: trượt từ đáy, bo góc trên 24.
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: extraColors.overlay },
  sheet: {
    gap: 20,
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background,
  },
  sheetHandle: { alignItems: 'center' },
  sheetHandleBar: { width: 38, height: 4, borderRadius: 4, backgroundColor: colors.border },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 24, color: colors.textDark },
  sheetOption: {
    justifyContent: 'center',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetOptionText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textDark },

  ingredientCard: {
    gap: 9,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ingredientTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowInput: {
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: extraColors.fieldSoft,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textDark,
  },
  nameInput: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14 },
  quantityInput: { width: 58, textAlign: 'center' },
  unitInput: { width: 74 },

  suggestions: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  pressed: { opacity: 0.85 },
  suggestionName: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textDark },
  suggestionMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },

  enRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: extraColors.fieldSoft,
  },
  enLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMid },
  enInput: {
    flex: 1,
    minHeight: 34,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textDark,
  },

  stepCard: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepTitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.primary },
  stepInput: {
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: extraColors.fieldSoft,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textDark,
  },

  busyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  busyText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.white },
});
