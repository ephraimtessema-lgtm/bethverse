import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  pin: 'bethverse_pin',
  biometric: 'bethverse_biometric',
  theme: 'bethverse_theme',
  font: 'bethverse_font',
  ocrLang: 'bethverse_ocr_lang',
  ocrQuality: 'bethverse_ocr_quality',
  amharicUi: 'bethverse_amharic_ui',
  lockOnLaunch: 'bethverse_lock_on_launch',
};

export const storage = {
  async getPin() {
    return AsyncStorage.getItem(KEYS.pin);
  },
  async setPin(pin: string | null) {
    if (pin) await AsyncStorage.setItem(KEYS.pin, pin);
    else await AsyncStorage.removeItem(KEYS.pin);
  },
  async getBiometric() {
    return (await AsyncStorage.getItem(KEYS.biometric)) === 'true';
  },
  async setBiometric(v: boolean) {
    await AsyncStorage.setItem(KEYS.biometric, v ? 'true' : 'false');
  },
  async getTheme() {
    return (await AsyncStorage.getItem(KEYS.theme)) ?? 'dark';
  },
  async setTheme(t: string) {
    await AsyncStorage.setItem(KEYS.theme, t);
  },
  async getOcrLang() {
    return (await AsyncStorage.getItem(KEYS.ocrLang)) ?? 'amharic';
  },
  async setOcrLang(l: string) {
    await AsyncStorage.setItem(KEYS.ocrLang, l);
  },
  async getFont() {
    return (await AsyncStorage.getItem(KEYS.font)) ?? 'amharic';
  },
  async setFont(f: string) {
    await AsyncStorage.setItem(KEYS.font, f);
  },
  async getOcrQuality() {
    return (await AsyncStorage.getItem(KEYS.ocrQuality)) ?? 'balanced';
  },
  async setOcrQuality(q: string) {
    await AsyncStorage.setItem(KEYS.ocrQuality, q);
  },
  async getAmharicUi() {
    const v = await AsyncStorage.getItem(KEYS.amharicUi);
    return v === null ? true : v === 'true';
  },
  async setAmharicUi(v: boolean) {
    await AsyncStorage.setItem(KEYS.amharicUi, v ? 'true' : 'false');
  },
  async getLockOnLaunch() {
    const v = await AsyncStorage.getItem(KEYS.lockOnLaunch);
    return v === null ? true : v === 'true';
  },
  async setLockOnLaunch(v: boolean) {
    await AsyncStorage.setItem(KEYS.lockOnLaunch, v ? 'true' : 'false');
  },
};
