// Bảng màu, font, bo góc của app

export const colors = {
  background: '#F8F6EF', // nền kem của mọi màn hình
  surface: '#FFFFFF', // nền ô nhập, ô OTP
  primary: '#286044', // xanh lá đậm: nút chính, link, logo
  textDark: '#243C2D', // chữ đậm (tiêu đề, nhãn)
  textMid: '#546255', // chữ vừa (mô tả)
  textMuted: '#758074', // chữ mờ, icon trong ô nhập, chú thích
  border: '#E1E5D9', // viền ô nhập
  softGreen: '#E7EEDF', // nền xanh nhạt (banner, thông báo thành công)
  error: '#AE4E3D', // chữ và viền báo lỗi
  errorBg: '#F7EDEC', // nền thông báo lỗi
  white: '#FFFFFF',
} as const;

// Toàn bộ app dùng font Inter.
export const fonts = {
  regular: 'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const radius = {
  input: 10, // ô nhập, thông báo
  hero: 28, // ảnh lớn, banner xanh
  pill: 100, // nút bấm bo tròn hoàn toàn
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
