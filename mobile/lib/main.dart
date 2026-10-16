import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/providers.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const ProviderScope(child: BethVerseApp()));
}

class BethVerseApp extends ConsumerWidget {
  const BethVerseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final fontStyle = ref.watch(fontStyleProvider);

    return MaterialApp.router(
      title: 'BethVerse',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(fontStyle),
      darkTheme: AppTheme.dark(fontStyle),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
