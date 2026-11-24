// Thang khoảng cách và cỡ chữ dùng chung cho layout.
// Tách riêng khỏi theme.ts (màu, font, bo góc) để không sửa file dùng chung của nhánh khác.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fontSize = {
  xs: 12, // chú thích, nhãn nhỏ
  sm: 14, // chữ nội dung mặc định
  md: 16, // chữ nhấn, nhãn ô nhập
  lg: 20, // tiêu đề mục
  xl: 24, // tiêu đề màn hình
  xxl: 32, // tiêu đề lớn, số liệu nổi bật
} as const;
