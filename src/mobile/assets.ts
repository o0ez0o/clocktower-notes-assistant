const assetUrl = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

export const mobileAssets = {
  iphoneBezel: assetUrl("iphone/Bezel.png"),
  iphoneKeyboard: assetUrl("iphone/Keyboard.png"),
  androidKeyboard: assetUrl("android/Keyboard.png"),
  pixel10Bezel: assetUrl("android/Pixel10.png"),
} as const;
