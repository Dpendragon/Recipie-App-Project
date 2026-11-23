export type IconAsset = {
  source: number;
  width: number;
  height: number;
};

function icon(source: number, width: number, height: number): IconAsset {
  return { source, width, height };
}

export const icons = {
  // Dùng chung nhiều màn hình
  back: icon(require('../../assets/icons/back.svg'), 13.333, 13.333),
  logoHeader: icon(require('../../assets/icons/logo-header.svg'), 25.958, 20.625),
  eye: icon(require('../../assets/icons/eye.svg'), 19.179, 12.833),
  eyeOff: icon(require('../../assets/icons/eye-off.svg'), 18.333, 16.5),

  // Màn hình Chào mừng
  utensils: icon(require('../../assets/icons/utensils.svg'), 12.083, 16.458),
  logoEmblem: icon(require('../../assets/icons/logo-emblem.svg'), 25.958, 20.625),
  arrowRightWelcome: icon(require('../../assets/icons/arrow-right-welcome.svg'), 11.625, 11.625),

  // Màn hình Đăng ký
  user: icon(require('../../assets/icons/user.svg'), 13.333, 13.333),
  mailSignUp: icon(require('../../assets/icons/mail-signup.svg'), 16.667, 13.333),
  lockSignUp: icon(require('../../assets/icons/lock-signup.svg'), 13.333, 17.5),
  arrowRightSignUp: icon(require('../../assets/icons/arrow-right-signup.svg'), 12, 12),
  googleSignUp: icon(require('../../assets/icons/google-signup.svg'), 16, 16),
  appleSignUp: icon(require('../../assets/icons/apple-signup.svg'), 16, 16),

  // Màn hình Đăng nhập
  badgePot: icon(require('../../assets/icons/badge-pot.svg'), 11.802, 9.333),
  mailSignIn: icon(require('../../assets/icons/mail-signin.svg'), 17.417, 13.75),
  lockSignIn: icon(require('../../assets/icons/lock-signin.svg'), 13.75, 17.875),
  arrowRightSignIn: icon(require('../../assets/icons/arrow-right-signin.svg'), 13.75, 13.75),
  googleSignIn: icon(require('../../assets/icons/google-signin.svg'), 16, 16),
  appleSignIn: icon(require('../../assets/icons/apple-signin.svg'), 16, 16),

  // Bộ thiết kế tông xanh — dùng chung
  plusWhite: icon(require('../../assets/icons/plus-white.svg'), 19, 19),
  plusGreen: icon(require('../../assets/icons/plus-green.svg'), 19, 19),
  sprout: icon(require('../../assets/icons/sprout.svg'), 18, 18),
  listChecks: icon(require('../../assets/icons/list-checks.svg'), 18, 18),
  infoGreen: icon(require('../../assets/icons/info-green.svg'), 18, 18),
  arrowLeft: icon(require('../../assets/icons/arrow-left.svg'), 22, 22),

  // Thanh tab (bản đang chọn / chưa chọn)
  tabBasket: icon(require('../../assets/icons/tab-basket.svg'), 22, 22),
  tabBasketActive: icon(require('../../assets/icons/tab-basket-active.svg'), 22, 22),
  tabCalendar: icon(require('../../assets/icons/tab-calendar.svg'), 22, 22),
  tabCalendarActive: icon(require('../../assets/icons/tab-calendar-active.svg'), 22, 22),

  // Màn Danh sách mua sắm
  circle: icon(require('../../assets/icons/circle.svg'), 21, 21),
  circleCheck: icon(require('../../assets/icons/circle-check.svg'), 21, 21),
  ellipsisVertical: icon(require('../../assets/icons/ellipsis-vertical.svg'), 17, 17),
  trash: icon(require('../../assets/icons/trash.svg'), 22, 22),
  basketEmpty: icon(require('../../assets/icons/basket-empty.svg'), 34, 34),

  // Màn Kế hoạch bữa ăn
  chevronLeft: icon(require('../../assets/icons/chevron-left.svg'), 22, 22),
  chevronRight: icon(require('../../assets/icons/chevron-right.svg'), 22, 22),
  coffee: icon(require('../../assets/icons/coffee.svg'), 28, 28),
  salad: icon(require('../../assets/icons/salad.svg'), 25, 25),
  ellipsis: icon(require('../../assets/icons/ellipsis.svg'), 18, 18),
  calendarSmall: icon(require('../../assets/icons/calendar-small.svg'), 19, 19),
  circleCheckSmall: icon(require('../../assets/icons/circle-check-small.svg'), 17, 17),
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
};

export const images = {
  // Ảnh bìa màn Chào mừng
  welcomeHero: require('../../assets/images/welcome-hero.png') as number,
  loginHero: require('../../assets/images/welcome-hero.png') as number,
};
