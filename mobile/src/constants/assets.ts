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
};

export const images = {
  // Ảnh bìa màn Chào mừng
  welcomeHero: require('../../assets/images/welcome-hero.png') as number,
  loginHero: require('../../assets/images/welcome-hero.png') as number,
};
