import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../models/collection.dart';
import '../models/poem.dart';
import '../providers/providers.dart';
import '../widgets/empty_state.dart';

const _colors = [
  Color(0xFF8B5CF6),
  Color(0xFFF43F5E),
  Color(0xFF3B82F6),
  Color(0xFF10B981),
  Color(0xFFF59E0B),
  Color(0xFF14B8A6),
  Color(0xFFEC4899),
  Color(0xFF6366F1),
];

class CollectionsScreen extends ConsumerStatefulWidget {
  const CollectionsScreen({super.key});

  @override
  ConsumerState<CollectionsScreen> createState() =>
      _CollectionsScreenState();
}

class _CollectionsScreenState extends ConsumerState<CollectionsScreen> {
  Future<void> _showDialog({PoemCollection? existing}) async {
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    var colorIndex = 0;
    if (existing?.color != null) {
      final idx = _colors.indexWhere(
        (c) => existing!.color!.contains(c.value.toRadixString(16)),
      );
      if (idx >= 0) colorIndex = idx;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                existing == null ? 'New Collection' : 'Edit Collection',
                style: Theme.of(ctx).textTheme.headlineMedium,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Name'),
                autofocus: true,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                children: List.generate(_colors.length, (i) {
                  return GestureDetector(
                    onTap: () => setModalState(() => colorIndex = i),
                    child: CircleAvatar(
                      radius: 18,
                      backgroundColor: _colors[i],
                      child: colorIndex == i
                          ? const Icon(Icons.check, color: Colors.white, size: 18)
                          : null,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () async {
                  final repo = await ref.read(repositoryProvider.future);
                  final color =
                      '#${_colors[colorIndex].value.toRadixString(16).substring(2)}';
                  if (existing != null) {
                    await repo.updateCollection(
                      existing.id,
                      name: nameCtrl.text.trim(),
                      color: color,
                    );
                  } else {
                    await repo.createCollection(
                      name: nameCtrl.text.trim(),
                      color: color,
                    );
                  }
                  ref.invalidate(collectionsProvider);
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final collectionsAsync = ref.watch(collectionsProvider);
    final poemsAsync = ref.watch(poemsProvider);
    final theme = Theme.of(context);

    return collectionsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('$e')),
      data: (collections) {
        final poems = poemsAsync.valueOrNull ?? [];

        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Collections',
                        style: theme.textTheme.displayMedium?.copyWith(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton.filled(
                      onPressed: () => _showDialog(),
                      icon: const Icon(Icons.add),
                    ),
                  ],
                ),
              ),
            ),
            if (collections.isEmpty)
              const SliverFillRemaining(
                child: EmptyState(
                  title: 'No collections',
                  description: 'Organize poems into themed collections.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverList.separated(
                  itemCount: collections.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final col = collections[i];
                    final count = poems
                        .where(
                          (p) =>
                              p.collection == col.name && !p.isArchived,
                        )
                        .length;
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _colors[i % _colors.length],
                          child: const Icon(Icons.folder, color: Colors.white),
                        ),
                        title: Text(col.name),
                        subtitle: Text('$count poems'),
                        trailing: PopupMenuButton(
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: 'edit',
                              child: Text('Edit'),
                            ),
                            const PopupMenuItem(
                              value: 'delete',
                              child: Text('Delete'),
                            ),
                          ],
                          onSelected: (v) async {
                            if (v == 'edit') {
                              _showDialog(existing: col);
                            } else if (v == 'delete') {
                              final repo =
                                  await ref.read(repositoryProvider.future);
                              await repo.deleteCollection(col.id);
                              ref.invalidate(collectionsProvider);
                            }
                          },
                        ),
                        onTap: () => context.push('/collection/${col.id}'),
                      ),
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
