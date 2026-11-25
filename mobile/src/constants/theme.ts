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
  star: '#B7832F', // sao đánh giá
  overlay: 'rgba(36,60,45,0.55)', // nền mờ phía sau bottom sheet
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
  card: 22, // thẻ món ăn
  pill: 100, // nút bấm bo tròn hoàn toàn
} as const;
