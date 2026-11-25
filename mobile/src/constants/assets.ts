export type IconAsset = {
  source: number;
  width: number;
  height: number;
};

function icon(source: number, width: number, height: number): IconAsset {
  return { source, width, height };
}

export const icons = {
  sprout: icon(require('../../assets/icons/ac-sprout.svg'), 28, 28), // logo mầm cây
  user: icon(require('../../assets/icons/ac-user.svg'), 19, 19),
  mail: icon(require('../../assets/icons/ac-mail.svg'), 19, 19),
  eye: icon(require('../../assets/icons/ac-eye.svg'), 19, 19), // đang hiện mật khẩu
  eyeOff: icon(require('../../assets/icons/ac-eye-off.svg'), 19, 19), // đang ẩn mật khẩu
  squareCheck: icon(require('../../assets/icons/ac-square-check.svg'), 21, 21), // ô tick (đã chọn)
  square: icon(require('../../assets/icons/ac-square.svg'), 21, 21), // ô tick (chưa chọn)
  arrowRight: icon(require('../../assets/icons/ac-arrow-right.svg'), 19, 19),
  arrowLeft: icon(require('../../assets/icons/ac-arrow-left.svg'), 22, 22),
  shieldCheck: icon(require('../../assets/icons/ac-shield-check.svg'), 14, 14),
  mailCheck: icon(require('../../assets/icons/ac-mail-check.svg'), 18, 18),
  mailCheckRed: icon(require('../../assets/icons/ac-mail-check-red.svg'), 18, 18),
  lock: icon(require('../../assets/icons/ac-lock.svg'), 18, 18),
  info: icon(require('../../assets/icons/ac-info.svg'), 18, 18),
  utensils: icon(require('../../assets/icons/ac-utensils.svg'), 18, 18), // dao nĩa (màn Chào mừng)

  // Chi tiết công thức (UC-08)
  clock: icon(require('../../assets/icons/rd-clock.svg'), 21, 21), // thời gian nấu
  users: icon(require('../../assets/icons/rd-users.svg'), 21, 21), // số khẩu phần
  flame: icon(require('../../assets/icons/rd-flame.svg'), 21, 21), // năng lượng (kcal)
  recipeNotFound: icon(require('../../assets/icons/rd-not-found.svg'), 34, 34),
  recipeOffline: icon(require('../../assets/icons/rd-offline.svg'), 34, 34),
  heart: icon(require('../../assets/icons/rd-heart.svg'), 20, 20), // nút Yêu thích
  circleCheck: icon(require('../../assets/icons/rd-circle-check.svg'), 17, 17), // nguyên liệu đã có
  circlePlus: icon(require('../../assets/icons/rd-circle-plus.svg'), 17, 17), // nguyên liệu cần mua
  cart: icon(require('../../assets/icons/rd-cart.svg'), 19, 19), // thêm vào danh sách mua sắm
  calendar: icon(require('../../assets/icons/rd-calendar.svg'), 19, 19), // thêm vào kế hoạch bữa ăn
  play: icon(require('../../assets/icons/rd-play.svg'), 22, 22), // nút phát video

  // Yêu thích (UC-09 → UC-11)
  heartCard: icon(require('../../assets/icons/fv-heart-card.svg'), 18, 18), // nút tim trên ảnh thẻ
  heartEmpty: icon(require('../../assets/icons/fv-heart-empty.svg'), 34, 34), // minh hoạ danh sách rỗng
  wifiOff: icon(require('../../assets/icons/fv-wifi-off.svg'), 18, 18), // banner đang ngoại tuyến
  cloudOff: icon(require('../../assets/icons/fv-cloud-off.svg'), 18, 18), // banner cần mạng để dùng thêm
  toastCheck: icon(require('../../assets/icons/fv-toast-check.svg'), 19, 19), // dấu tick trên toast
  calendarGreen: icon(require('../../assets/icons/fv-calendar.svg'), 19, 19), // nút phụ "Thêm món vào kế hoạch"

  // Đánh giá (UC-12 → UC-16)
  starOutline: icon(require('../../assets/icons/rv-star-outline.svg'), 35, 35), // sao chưa chọn
  starFilled: icon(require('../../assets/icons/rv-star-filled.svg'), 35, 35), // sao đã chọn

  // Đăng và sửa công thức (UC-17, UC-19). Bản 19px màu xám của clock-3 và
  // users-round: rd-clock, rd-users là cùng hình nhưng 21px màu xanh của màn chi tiết.
  formServings: icon(require('../../assets/icons/rf-users.svg'), 19, 19), // ô "Số người ăn"
  formMinutes: icon(require('../../assets/icons/rf-clock.svg'), 19, 19), // ô "Thời gian (phút)"
  formLink: icon(require('../../assets/icons/rf-link.svg'), 19, 19), // ô "Liên kết video"
  formTrash: icon(require('../../assets/icons/rf-trash.svg'), 16, 16), // xoá nguyên liệu, xoá bước
  formPlus: icon(require('../../assets/icons/rf-plus.svg'), 19, 19), // nút thêm nguyên liệu, thêm bước
  formPencil: icon(require('../../assets/icons/rf-pencil.svg'), 18, 18), // banner "Đang sửa món đã đăng"
  formSalad: icon(require('../../assets/icons/rf-salad.svg'), 18, 18), // banner ghi chú dinh dưỡng

  // Công thức của tôi (UC-18, UC-20). Cùng hình notebook-pen nhưng hai bản khác
  // nét: 18px cho banner ghi chú, 34px (nét 1.5) cho minh hoạ danh sách rỗng.
  notebookPen: icon(require('../../assets/icons/mr-notebook-pen.svg'), 18, 18),
  notebookPenEmpty: icon(require('../../assets/icons/mr-notebook-pen-lg.svg'), 34, 34),
};

export const images = {
  // Ảnh bìa màn Chào mừng
  welcomeHero: require('../../assets/images/welcome-hero.png') as number,
  loginHero: require('../../assets/images/welcome-hero.png') as number,
};
