import 'package:shared_preferences/shared_preferences.dart';

/// Local preferences only — no network or cloud auth.
class StorageService {
  StorageService(this._prefs);

  final SharedPreferences _prefs;

  static const _pinKey = 'bethverse_pin';
  static const _biometricKey = 'bethverse_biometric';
  static const _themeKey = 'bethverse_theme';
  static const _fontKey = 'bethverse_font';

  String? getPin() => _prefs.getString(_pinKey);

  Future<void> setPin(String? pin) async {
    if (pin == null) {
      await _prefs.remove(_pinKey);
    } else {
      await _prefs.setString(_pinKey, pin);
    }
  }

  bool get biometricEnabled => _prefs.getBool(_biometricKey) ?? false;

  Future<void> setBiometricEnabled(bool value) =>
      _prefs.setBool(_biometricKey, value);

  String get themeMode => _prefs.getString(_themeKey) ?? 'system';

  Future<void> setThemeMode(String mode) => _prefs.setString(_themeKey, mode);

  String get fontStyle => _prefs.getString(_fontKey) ?? 'serif';

  Future<void> setFontStyle(String style) => _prefs.setString(_fontKey, style);

  static Future<StorageService> create() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }
}
