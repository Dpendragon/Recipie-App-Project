export type IconAsset = {
  source: number; // kết quả của require(...) là một số định danh của ảnh
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
};

export const images = {
  // Ảnh bàn tiệc ở nửa trên màn hình Chào mừng.
  welcomeHero: require('../../assets/images/welcome-hero.png') as number,
};
