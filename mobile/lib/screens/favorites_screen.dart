import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/poem.dart';
import '../providers/providers.dart';
import '../widgets/empty_state.dart';
import '../widgets/poem_card.dart';
import '../widgets/search_bar.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final poemsAsync = ref.watch(poemsProvider);
    final theme = Theme.of(context);

    return poemsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('$e')),
      data: (poems) {
        var list = poems
            .where((p) => p.isFavorite && !p.isArchived)
            .toList();
        if (_search.isNotEmpty) {
          final q = _search.toLowerCase();
          list = list
              .where(
                (p) =>
                    (p.title ?? '').toLowerCase().contains(q) ||
                    (p.plainText ?? '').toLowerCase().contains(q),
              )
              .toList();
        }

        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Favorites',
                      style: theme.textTheme.displayMedium?.copyWith(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    PoemSearchBar(
                      value: _search,
                      onChanged: (v) => setState(() => _search = v),
                    ),
                  ],
                ),
              ),
            ),
            if (list.isEmpty)
              const SliverFillRemaining(
                child: EmptyState(
                  title: 'No favorites yet',
                  description: 'Tap the heart on a poem to save it here.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverList.separated(
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final poem = list[i];
                    return PoemCard(
                      poem: poem,
                      onTap: () => context.push('/editor/${poem.id}'),
                      onFavorite: () async {
                        final repo = await ref.read(repositoryProvider.future);
                        await repo.updatePoem(poem.id, {'is_favorite': false});
                        ref.invalidate(poemsProvider);
                      },
                    );
                  },
                ),
              ),
          ],
        );
      },
    );
  }
}
