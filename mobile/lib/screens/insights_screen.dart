import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/collection.dart';
import '../models/poem.dart';
import '../providers/providers.dart';

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final poemsAsync = ref.watch(poemsProvider);
    final collectionsAsync = ref.watch(collectionsProvider);
    final theme = Theme.of(context);

    return poemsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('$e')),
      data: (poems) {
        final collections = collectionsAsync.valueOrNull ?? [];
        final active = poems.where((p) => !p.isArchived).toList();
        final totalWords =
            active.fold<int>(0, (s, p) => s + p.wordCount);
        final favoriteCount =
            active.where((p) => p.isFavorite).length;
        final archivedCount = poems.where((p) => p.isArchived).length;

        Poem? longest;
        for (final p in active) {
          if (longest == null || p.wordCount > longest.wordCount) {
            longest = p;
          }
        }

        Poem? mostEdited;
        for (final p in active) {
          if (mostEdited == null || p.editCount > mostEdited.editCount) {
            mostEdited = p;
          }
        }

        final dates = active
            .map((p) => DateTime(
                  p.createdDate?.year ?? 0,
                  p.createdDate?.month ?? 0,
                  p.createdDate?.day ?? 0,
                ))
            .toSet();
        var streak = 0;
        final today = DateTime.now();
        for (var i = 0; i < 365; i++) {
          final d = DateTime(today.year, today.month, today.day - i);
          final key = DateTime(d.year, d.month, d.day);
          if (dates.contains(key)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }

        final cards = [
          _Stat('Total Poems', '${active.length}', Icons.article, Colors.deepPurple),
          _Stat('Total Words', totalWords.toString(), Icons.text_fields, Colors.blue),
          _Stat('Writing Streak', '${streak}d', Icons.local_fire_department, Colors.orange),
          _Stat('Favorites', '$favoriteCount', Icons.favorite, Colors.pink),
          _Stat('Collections', '${collections.length}', Icons.folder, Colors.green),
          _Stat('Archived', '$archivedCount', Icons.archive, Colors.blueGrey),
        ];

        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Insights',
                      style: theme.textTheme.displayMedium?.copyWith(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Your poetry statistics',
                      style: theme.textTheme.labelSmall,
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.1,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _StatCard(stat: cards[i]),
                  childCount: cards.length,
                ),
              ),
            ),
            if (active.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Highlights',
                        style: theme.textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 12),
                      _HighlightCard(
                        icon: Icons.emoji_events,
                        title: 'Longest Poem',
                        subtitle: longest?.title ?? '—',
                        detail: '${longest?.wordCount ?? 0} words',
                      ),
                      const SizedBox(height: 12),
                      _HighlightCard(
                        icon: Icons.edit,
                        title: 'Most Edited',
                        subtitle: mostEdited?.title ?? '—',
                        detail: '${mostEdited?.editCount ?? 0} edits',
                      ),
                    ],
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        );
      },
    );
  }
}

class _Stat {
  const _Stat(this.label, this.value, this.icon, this.color);
  final String label;
  final String value;
  final IconData icon;
  final Color color;
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.stat});
  final _Stat stat;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: stat.color,
              radius: 20,
              child: Icon(stat.icon, color: Colors.white, size: 20),
            ),
            const Spacer(),
            Text(
              stat.value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Text(stat.label, style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
      ),
    );
  }
}

class _HighlightCard extends StatelessWidget {
  const _HighlightCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.detail,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String detail;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 16,
                  ),
            ),
            Text(detail, style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
      ),
    );
  }
}
