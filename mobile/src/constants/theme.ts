import type { BoxShadowValue } from 'react-native';

export const colors = {
  background: '#FFF8F5', // nền kem ấm của mọi màn hình
  surface: '#FFFFFF', // nền thẻ (card), nút trắng
  primary: '#E8734A', // cam chủ đạo (nút bấm chính, link nhấn mạnh)
  brand: '#A23F1A', // nâu đỏ (logo chữ, tiêu đề thương hiệu, link điều khoản)
  textDark: '#251910', // chữ đậm (tiêu đề, nhãn)
  textMid: '#57423B', // chữ vừa (mô tả)
  textMuted: '#8A726A', // chữ mờ (chú thích)
  placeholder: 'rgba(138,114,106,0.7)', // chữ gợi ý trong ô nhập
  inputFill: '#FFF1E9', // nền ô nhập (đăng ký)
  inputFillSoft: 'rgba(255,241,233,0.4)', // nền ô nhập (đăng nhập)
  green: '#466824', // chấm xanh ở huy hiệu màn hình chào mừng
  error: '#BA1A1A', // chữ & viền báo lỗi
  errorBg: '#FDECEA',
  successBg: '#E8F3DC',
  white: '#FFFFFF',
} as const;

// Quicksand dùng cho tiêu đề, Be Vietnam Pro dùng cho nội dung (hỗ trợ tốt tiếng Việt).
export const fonts = {
  heading: 'Quicksand_700Bold',
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semiBold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

// "Pill" = hình viên thuốc: bo tròn hoàn toàn 2 đầu (radius rất lớn).
export const radius = {
  pill: 9999,
} as const;

// Đổ bóng.
export const shadows: Record<
  'soft' | 'pill' | 'ctaWelcome' | 'ctaSignIn',
  BoxShadowValue[]
> = {
  // Bóng nhẹ dùng cho thẻ form, nút quay lại, nút Google/Apple, nút Đăng ký.
  soft: [
    { offsetX: 0, offsetY: 4, blurRadius: 16, spreadDistance: -2, color: 'rgba(46,33,24,0.06)' },
    { offsetX: 0, offsetY: 1, blurRadius: 4, spreadDistance: -1, color: 'rgba(46,33,24,0.03)' },
  ],
  // Bóng cho 2 viên thuốc tính năng ở màn hình chào mừng.
  pill: [
    { offsetX: 0, offsetY: 12, blurRadius: 32, spreadDistance: -4, color: 'rgba(46,33,24,0.08)' },
    { offsetX: 0, offsetY: 2, blurRadius: 6, spreadDistance: -1, color: 'rgba(46,33,24,0.04)' },
  ],
  // Bóng cam của nút "Đăng ký" ở màn hình chào mừng.
  ctaWelcome: [
    { offsetX: 0, offsetY: 8, blurRadius: 24, spreadDistance: -2, color: 'rgba(232,115,74,0.35)' },
  ],
  // Bóng của nút "Đăng nhập" trong form.
  ctaSignIn: [
    { offsetX: 0, offsetY: 12, blurRadius: 32, spreadDistance: -4, color: 'rgba(46,33,24,0.1)' },
  ],
};

// ---------------------------------------------------------------------------
// Bộ thiết kế tông xanh (Figma Page 1) — dùng cho các màn Mua sắm, Kế hoạch...
// Giữ riêng với bảng màu cam ở trên để các màn đăng nhập/đăng ký không bị đổi.
// ---------------------------------------------------------------------------
export const appColors = {
  background: '#F8F6EF', // nền kem của màn hình
  surface: '#FFFFFF', // nền thẻ, ô nhập
  primary: '#286044', // xanh chủ đạo (nút chính, chữ nhấn)
  primarySoft: '#E7EEDF', // nền nút phụ, thẻ form, hộp thông báo
  segment: '#F0F1E9', // nền thanh chuyển chế độ
  textDark: '#243C2D', // tiêu đề, tên nguyên liệu
  textMuted: '#546255', // chú thích, số lượng
  iconMuted: '#758074', // icon chưa chọn
  border: '#E1E5D9', // viền thẻ, đường kẻ giữa các dòng
  danger: '#AE4E3D', // xoá, lỗi
  warningBg: '#F5EBD8', // nền thông báo cảnh báo
  warningText: '#866333',
  overlay: 'rgba(0,0,0,0.4)', // lớp tối phía sau menu
  white: '#FFFFFF',
} as const;

export const appFonts = {
  regular: 'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const appRadius = {
  pill: 100, // nút, chip, ô ngày
  input: 10, // ô nhập, hộp thông báo
  card: 16,
  cardLarge: 20, // ảnh món, thẻ công thức
} as const;

// Lề ngang của nội dung màn hình.
export const SCREEN_PADDING = 22;
