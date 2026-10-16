import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/poem.dart';
import '../providers/providers.dart';
import '../widgets/empty_state.dart';
import '../widgets/poem_card.dart';
import '../widgets/search_bar.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _search = '';
  String _sort = '-created_date';
  bool _archivedTab = false;

  List<Poem> _filter(List<Poem> poems) {
    var list = poems
        .where((p) => _archivedTab ? p.isArchived : !p.isArchived)
        .toList();

    if (_search.isNotEmpty) {
      final q = _search.toLowerCase();
      list = list
          .where(
            (p) =>
                (p.title ?? '').toLowerCase().contains(q) ||
                (p.plainText ?? '').toLowerCase().contains(q) ||
                (p.collection ?? '').toLowerCase().contains(q),
          )
          .toList();
    }

    list.sort((a, b) {
      switch (_sort) {
        case 'created_date':
          return (a.createdDate ?? DateTime(0))
              .compareTo(b.createdDate ?? DateTime(0));
        case 'title':
          return (a.title ?? '').compareTo(b.title ?? '');
        case '-updated_date':
          return (b.updatedDate ?? DateTime(0))
              .compareTo(a.updatedDate ?? DateTime(0));
        default:
          return (b.createdDate ?? DateTime(0))
              .compareTo(a.createdDate ?? DateTime(0));
      }
    });
    return list;
  }

  Future<void> _createPoem({String? plainText, String? title}) async {
    final repo = await ref.read(repositoryProvider.future);
    final poem = await repo.createPoem(
      title: title ?? '',
      plainText: plainText ?? '',
    );
    ref.invalidate(poemsProvider);
    if (mounted) context.push('/editor/${poem.id}');
  }

  Future<void> _updatePoem(String id, Map<String, dynamic> data) async {
    final repo = await ref.read(repositoryProvider.future);
    await repo.updatePoem(id, data);
    ref.invalidate(poemsProvider);
  }

  Future<void> _deletePoem(String id) async {
    final repo = await ref.read(repositoryProvider.future);
    await repo.deletePoem(id);
    ref.invalidate(poemsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final poemsAsync = ref.watch(poemsProvider);
    final theme = Theme.of(context);

    return poemsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (poems) {
        final filtered = _filter(poems);
        final activeCount = poems.where((p) => !p.isArchived).length;
        final archivedCount = poems.where((p) => p.isArchived).length;

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(poemsProvider),
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'BethVerse',
                              style: theme.textTheme.displayMedium?.copyWith(
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Your offline poetry vault',
                              style: theme.textTheme.labelSmall,
                            ),
                          ],
                        ),
                      ),
                      IconButton.outlined(
                        onPressed: () => context.push('/ocr'),
                        icon: const Icon(Icons.document_scanner_outlined),
                      ),
                      const SizedBox(width: 8),
                      FloatingActionButton.small(
                        onPressed: () => _createPoem(),
                        child: const Icon(Icons.add),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: PoemSearchBar(
                    value: _search,
                    onChanged: (v) => setState(() => _search = v),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      SegmentedButton<bool>(
                        segments: [
                          ButtonSegment(
                            value: false,
                            label: Text(
                              activeCount > 0
                                  ? 'Poems ($activeCount)'
                                  : 'Poems',
                            ),
                          ),
                          ButtonSegment(
                            value: true,
                            label: Text(
                              archivedCount > 0
                                  ? 'Archive ($archivedCount)'
                                  : 'Archive',
                            ),
                          ),
                        ],
                        selected: {_archivedTab},
                        onSelectionChanged: (s) =>
                            setState(() => _archivedTab = s.first),
                      ),
                      const Spacer(),
                      PopupMenuButton<String>(
                        initialValue: _sort,
                        onSelected: (v) => setState(() => _sort = v),
                        itemBuilder: (context) => const [
                          PopupMenuItem(
                            value: '-created_date',
                            child: Text('Newest'),
                          ),
                          PopupMenuItem(
                            value: 'created_date',
                            child: Text('Oldest'),
                          ),
                          PopupMenuItem(value: 'title', child: Text('Title')),
                          PopupMenuItem(
                            value: '-updated_date',
                            child: Text('Recently edited'),
                          ),
                        ],
                        child: const Icon(Icons.sort),
                      ),
                    ],
                  ),
                ),
              ),
              if (filtered.isEmpty)
                SliverFillRemaining(
                  child: EmptyState(
                    title: _search.isNotEmpty
                        ? 'No poems found'
                        : _archivedTab
                            ? 'No archived poems'
                            : 'Begin your journey',
                    description: _search.isNotEmpty
                        ? 'Try a different search term'
                        : _archivedTab
                            ? 'Archived poems will appear here'
                            : 'Tap + to write your first poem.',
                    actionLabel:
                        !_archivedTab && _search.isEmpty ? 'Write a Poem' : null,
                    onAction:
                        !_archivedTab && _search.isEmpty ? () => _createPoem() : null,
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
                  sliver: SliverList.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final poem = filtered[i];
                      return PoemCard(
                        poem: poem,
                        onTap: () => context.push('/editor/${poem.id}'),
                        onFavorite: () => _updatePoem(poem.id, {
                          'is_favorite': !poem.isFavorite,
                        }),
                        onArchive: () => _updatePoem(poem.id, {
                          'is_archived': !poem.isArchived,
                        }),
                        onDuplicate: () async {
                          final repo = await ref.read(repositoryProvider.future);
                          final copy = await repo.duplicatePoem(poem);
                          ref.invalidate(poemsProvider);
                          if (mounted) context.push('/editor/${copy.id}');
                        },
                        onDelete: () => _confirmDelete(poem),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  void _confirmDelete(Poem poem) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete poem?'),
        content: Text(
          '"${poem.title ?? 'Untitled'}" will be permanently removed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              await _deletePoem(poem.id);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
