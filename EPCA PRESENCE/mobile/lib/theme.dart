import 'package:flutter/material.dart';

class EpcaColors {
  static const navy = Color(0xFF0B1F3A);
  static const navyMid = Color(0xFF16345C);
  static const brand = Color(0xFF1E4A8A);
  static const canvas = Color(0xFFF3F5F8);
  static const ink = Color(0xFF0F172A);
  static const muted = Color(0xFF64748B);
  static const line = Color(0xFFE2E8F0);
  static const present = Color(0xFF059669);
  static const absent = Color(0xFFE11D48);
  static const late = Color(0xFFD97706);
  static const excused = Color(0xFF7C3AED);
  static const fluo = Color(0xFF3DFF9A);
  static const sky = Color(0xFF0284C7);
  static const amber = Color(0xFFF59E0B);
  static const mint = Color(0xFF10B981);
}

class EpcaTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: EpcaColors.brand,
        primary: EpcaColors.navy,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: EpcaColors.canvas,
      fontFamily: 'Roboto',
    );

    return base.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: EpcaColors.ink,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: EpcaColors.ink,
          letterSpacing: -0.3,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: EpcaColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: EpcaColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: EpcaColors.brand, width: 1.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: EpcaColors.navy,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFE8EEF7),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? EpcaColors.navy : EpcaColors.muted,
          );
        }),
      ),
    );
  }
}
