// Định dạng dùng chung cho các thành phần đánh giá.

// Dải 5 sao cho số sao nguyên 1–5 (hoặc điểm trung bình, làm tròn về sao gần nhất).
export function formatStars(value: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

// Điểm trung bình theo kiểu Việt: 4.8 -> "4,8"; số nguyên giữ nguyên ("5").
export function formatAverage(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

// Ngày dd/MM/yyyy theo giờ máy, từ chuỗi ISO của server.
export function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
