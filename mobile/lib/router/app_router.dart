import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../screens/collection_detail_screen.dart';
import '../screens/collections_screen.dart';
import '../screens/editor_screen.dart';
import '../screens/favorites_screen.dart';
import '../screens/home_screen.dart';
import '../screens/insights_screen.dart';
import '../screens/ocr_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/shell_screen.dart';
import '../widgets/pin_lock_overlay.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      ShellRoute(
        builder: (context, state, child) => PinLockOverlay(
          child: ShellScreen(child: child),
        ),
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/collections',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: CollectionsScreen()),
          ),
          GoRoute(
            path: '/favorites',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: FavoritesScreen()),
          ),
          GoRoute(
            path: '/insights',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: InsightsScreen()),
          ),
          GoRoute(
            path: '/settings',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SettingsScreen()),
          ),
        ],
      ),
      GoRoute(
        path: '/collection/:id',
        builder: (context, state) =>
            CollectionDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/editor/:id',
        builder: (context, state) =>
            EditorScreen(poemId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/ocr',
        builder: (context, state) => const OcrScreen(),
      ),
    ],
  );
});
