export type IconAsset = {
  source: number;
  width: number;
  height: number;
};

function icon(source: number, width: number, height: number): IconAsset {
  return { source, width, height };
}

export const icons = {
  // ---------------------------------------------------------------------------
  // Nhóm Auth: Chào mừng / Đăng nhập / Đăng ký / Quên mật khẩu (file ac-*.svg)
  // ---------------------------------------------------------------------------
  sprout: icon(require('../../assets/icons/ac-sprout.svg'), 28, 28), // logo mầm cây (BrandLogo, màn Chào mừng)
  utensils: icon(require('../../assets/icons/ac-utensils.svg'), 18, 18), // dao nĩa (màn Chào mừng)
  user: icon(require('../../assets/icons/ac-user.svg'), 19, 19),
  mail: icon(require('../../assets/icons/ac-mail.svg'), 19, 19),
  lock: icon(require('../../assets/icons/ac-lock.svg'), 18, 18),
  eye: icon(require('../../assets/icons/ac-eye.svg'), 19, 19), // đang hiện mật khẩu
  eyeOff: icon(require('../../assets/icons/ac-eye-off.svg'), 19, 19), // đang ẩn mật khẩu
  squareCheck: icon(require('../../assets/icons/ac-square-check.svg'), 21, 21), // ô tick (đã chọn)
  square: icon(require('../../assets/icons/ac-square.svg'), 21, 21), // ô tick (chưa chọn)
  arrowRight: icon(require('../../assets/icons/ac-arrow-right.svg'), 19, 19),
  shieldCheck: icon(require('../../assets/icons/ac-shield-check.svg'), 14, 14),
  mailCheck: icon(require('../../assets/icons/ac-mail-check.svg'), 18, 18),
  mailCheckRed: icon(require('../../assets/icons/ac-mail-check-red.svg'), 18, 18),

  search: icon(require('../../assets/icons/se-search.svg'), 20, 20),
  searchWhite: icon(require('../../assets/icons/se-search-white.svg'), 19, 19), 
  searchLarge: icon(require('../../assets/icons/se-search-large.svg'), 34, 34), 
  filter: icon(require('../../assets/icons/se-filter.svg'), 20, 20),
  filterGreen: icon(require('../../assets/icons/se-filter-green.svg'), 18, 18), 
  close: icon(require('../../assets/icons/se-close.svg'), 12, 12), 
  closeDark: icon(require('../../assets/icons/se-close-dark.svg'), 18, 18),
  plus: icon(require('../../assets/icons/se-plus.svg'), 12, 12), 
  heart: icon(require('../../assets/icons/se-heart.svg'), 18, 18), 
  heartFilled: icon(require('../../assets/icons/se-heart-filled.svg'), 18, 18), 
  leaf: icon(require('../../assets/icons/se-leaf.svg'), 18, 18), 
  basket: icon(require('../../assets/icons/se-basket.svg'), 34, 34),
  info: icon(require('../../assets/icons/ac-info.svg'), 18, 18), // dùng trên nền tối (banner hết phiên)

  // ---------------------------------------------------------------------------
  // Bộ thiết kế tông xanh — dùng chung nhiều màn hình
  // ---------------------------------------------------------------------------
  arrowLeft: icon(require('../../assets/icons/ac-arrow-left.svg'), 22, 22), // nút quay lại (auth + Kế hoạch)
  sproutSmall: icon(require('../../assets/icons/sprout.svg'), 18, 18), // mầm cây nhỏ trong NoticeBox
  plusWhite: icon(require('../../assets/icons/plus-white.svg'), 19, 19),
  plusGreen: icon(require('../../assets/icons/plus-green.svg'), 19, 19),
  listChecks: icon(require('../../assets/icons/list-checks.svg'), 18, 18),
  infoGreen: icon(require('../../assets/icons/info-green.svg'), 18, 18),

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
};

export const images = {
  // Ảnh bìa màn Chào mừng
  welcomeHero: require('../../assets/images/welcome-hero.png') as number,
  loginHero: require('../../assets/images/welcome-hero.png') as number,
};