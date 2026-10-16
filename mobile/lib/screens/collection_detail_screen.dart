import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/collection.dart';
import '../models/poem.dart';
import '../providers/providers.dart';
import '../widgets/empty_state.dart';
import '../widgets/poem_card.dart';
import '../widgets/search_bar.dart';

class CollectionDetailScreen extends ConsumerStatefulWidget {
  const CollectionDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<CollectionDetailScreen> createState() =>
      _CollectionDetailScreenState();
}

class _CollectionDetailScreenState
    extends ConsumerState<CollectionDetailScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final collectionsAsync = ref.watch(collectionsProvider);
    final poemsAsync = ref.watch(poemsProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: collectionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (collections) {
          final collection =
              collections.where((c) => c.id == widget.id).firstOrNull;

          return poemsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('$e')),
            data: (poems) {
              var list = poems
                  .where(
                    (p) =>
                        p.collection == collection?.name && !p.isArchived,
                  )
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
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            collection?.name ?? 'Collection',
                            style: Theme.of(context)
                                .textTheme
                                .displayMedium
                                ?.copyWith(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text('${list.length} poems'),
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
                        title: 'No poems here',
                        description: 'Assign poems to this collection from the editor.',
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
                      sliver: SliverList.separated(
                        itemCount: list.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 12),
                        itemBuilder: (context, i) {
                          final poem = list[i];
                          return PoemCard(
                            poem: poem,
                            onTap: () =>
                                context.push('/editor/${poem.id}'),
                            onFavorite: () async {
                              final repo =
                                  await ref.read(repositoryProvider.future);
                              await repo.updatePoem(poem.id, {
                                'is_favorite': !poem.isFavorite,
                              });
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
        },
      ),
    );
  }
}
