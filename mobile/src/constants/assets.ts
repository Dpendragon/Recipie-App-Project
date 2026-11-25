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
};

export const images = {
  // Ảnh bìa màn Chào mừng
  welcomeHero: require('../../assets/images/welcome-hero.png') as number,
  loginHero: require('../../assets/images/welcome-hero.png') as number,
};
