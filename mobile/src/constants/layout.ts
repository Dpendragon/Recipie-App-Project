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

// Màu bổ sung theo Figma cho các trạng thái không có trong theme.ts (file dùng
// chung của nhánh khác nên không sửa): banner cảnh báo ngoại tuyến và khung xương tải.
export const extraColors = {
  warningBg: '#F5EBD8', // nền banner "Bạn đang ngoại tuyến"
  warningText: '#866333', // chữ và icon banner cảnh báo
  skeletonSoft: '#F0F1E9', // thanh xương nhạt (dòng phụ)
  star: '#C58A35', // sao đánh giá
  dangerBg: '#FAEDE8', // nền nút "Xóa đánh giá"
  disabledBg: '#DDE2D7', // nền nút gửi khi chưa chọn sao
  overlay: 'rgba(0,0,0,0.4)', // lớp phủ sau hộp thoại xác nhận
} as const;
