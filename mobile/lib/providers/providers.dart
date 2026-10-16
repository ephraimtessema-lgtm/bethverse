import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/app_repository.dart';
import '../models/collection.dart';
import '../models/poem.dart';
import '../services/storage_service.dart';

final storageProvider = FutureProvider<StorageService>((ref) async {
  return StorageService.create();
});

final repositoryProvider = FutureProvider<AppRepository>((ref) async {
  return AppRepository.open();
});

final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier(ref);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier(this._ref) : super(ThemeMode.system) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    final storage = await _ref.read(storageProvider.future);
    final mode = storage.themeMode;
    state = switch (mode) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  Future<void> setMode(String mode) async {
    final storage = await _ref.read(storageProvider.future);
    await storage.setThemeMode(mode);
    state = switch (mode) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }
}

final fontStyleProvider =
    StateNotifierProvider<FontStyleNotifier, String>((ref) {
  return FontStyleNotifier(ref);
});

class FontStyleNotifier extends StateNotifier<String> {
  FontStyleNotifier(this._ref) : super('serif') {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    final storage = await _ref.read(storageProvider.future);
    state = storage.fontStyle;
  }

  Future<void> setStyle(String style) async {
    final storage = await _ref.read(storageProvider.future);
    await storage.setFontStyle(style);
    state = style;
  }
}

final pinLockProvider = StateNotifierProvider<PinLockNotifier, PinLockState>(
  (ref) => PinLockNotifier(ref),
);

class PinLockState {
  const PinLockState({
    this.pin,
    this.isLocked = false,
    this.biometricEnabled = false,
  });

  final String? pin;
  final bool isLocked;
  final bool biometricEnabled;

  PinLockState copyWith({
    String? pin,
    bool? isLocked,
    bool? biometricEnabled,
    bool clearPin = false,
  }) {
    return PinLockState(
      pin: clearPin ? null : (pin ?? this.pin),
      isLocked: isLocked ?? this.isLocked,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
    );
  }
}

class PinLockNotifier extends StateNotifier<PinLockState> {
  PinLockNotifier(this._ref) : super(const PinLockState()) {
    _load();
  }

  final Ref _ref;

  Future<void> _load() async {
    final storage = await _ref.read(storageProvider.future);
    state = PinLockState(
      pin: storage.getPin(),
      biometricEnabled: storage.biometricEnabled,
    );
  }

  Future<void> savePin(String pin) async {
    final storage = await _ref.read(storageProvider.future);
    await storage.setPin(pin);
    state = state.copyWith(pin: pin, isLocked: false);
  }

  Future<void> removePin() async {
    final storage = await _ref.read(storageProvider.future);
    await storage.setPin(null);
    await storage.setBiometricEnabled(false);
    state = const PinLockState();
  }

  void lock() {
    if (state.pin != null) {
      state = state.copyWith(isLocked: true);
    }
  }

  void unlock() => state = state.copyWith(isLocked: false);

  Future<void> setBiometric(bool enabled) async {
    final storage = await _ref.read(storageProvider.future);
    await storage.setBiometricEnabled(enabled);
    state = state.copyWith(biometricEnabled: enabled);
  }
}

final poemsProvider = FutureProvider<List<Poem>>((ref) async {
  final repo = await ref.watch(repositoryProvider.future);
  return repo.listPoems();
});

final collectionsProvider = FutureProvider<List<PoemCollection>>((ref) async {
  final repo = await ref.watch(repositoryProvider.future);
  return repo.listCollections();
});
