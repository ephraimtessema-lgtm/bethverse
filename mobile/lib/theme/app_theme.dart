import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const primary = Color(0xFF9B6FE8);
  static const primaryDark = Color(0xFF7B4FD4);
  static const backgroundLight = Color(0xFFF9F9FB);
  static const backgroundDark = Color(0xFF0F1729);
  static const cardLight = Colors.white;
  static const cardDark = Color(0xFF1A2236);
}

class AppTheme {
  static ThemeData light(String fontStyle) => _build(
        brightness: Brightness.light,
        background: AppColors.backgroundLight,
        card: AppColors.cardLight,
        fontStyle: fontStyle,
      );

  static ThemeData dark(String fontStyle) => _build(
        brightness: Brightness.dark,
        background: AppColors.backgroundDark,
        card: AppColors.cardDark,
        fontStyle: fontStyle,
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color background,
    required Color card,
    required String fontStyle,
  }) {
    final isDark = brightness == Brightness.dark;
    final bodyFont = _bodyFont(fontStyle);
    final displayFont = _displayFont(fontStyle);

    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: brightness,
      surface: background,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme.copyWith(
        primary: AppColors.primary,
        surface: background,
      ),
      scaffoldBackgroundColor: background,
      cardColor: card,
      appBarTheme: AppBarTheme(
        backgroundColor: background.withValues(alpha: 0.9),
        elevation: 0,
        centerTitle: false,
        titleTextStyle: displayFont.copyWith(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : const Color(0xFF0F1729),
        ),
      ),
      textTheme: TextTheme(
        displayLarge: displayFont,
        displayMedium: displayFont,
        headlineMedium: displayFont.copyWith(fontWeight: FontWeight.w600),
        bodyLarge: bodyFont.copyWith(fontSize: 16, height: 1.6),
        bodyMedium: bodyFont.copyWith(fontSize: 14),
        labelSmall: GoogleFonts.inter(
          fontSize: 11,
          color: isDark ? Colors.white54 : Colors.black54,
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFEDEEF2),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  static TextStyle _displayFont(String style) {
    return switch (style) {
      'modern' => GoogleFonts.inter(fontWeight: FontWeight.w600),
      'classic' => GoogleFonts.playfairDisplay(fontWeight: FontWeight.w600),
      _ => GoogleFonts.playfairDisplay(fontWeight: FontWeight.w600),
    };
  }

  static TextStyle _bodyFont(String style) {
    return switch (style) {
      'modern' => GoogleFonts.inter(),
      'classic' => GoogleFonts.playfairDisplay(),
      _ => GoogleFonts.lora(),
    };
  }
}
