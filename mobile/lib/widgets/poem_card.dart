import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/poem.dart';

class PoemCard extends StatelessWidget {
  const PoemCard({
    super.key,
    required this.poem,
    required this.onTap,
    required this.onFavorite,
    this.onArchive,
    this.onDuplicate,
    this.onDelete,
  });

  final Poem poem;
  final VoidCallback onTap;
  final VoidCallback onFavorite;
  final VoidCallback? onArchive;
  final VoidCallback? onDuplicate;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final preview = poem.plainText ?? '';
    final short = preview.length > 120
        ? '${preview.substring(0, 120)}…'
        : preview;
    final date = poem.createdDate != null
        ? DateFormat('MMM d, yyyy').format(poem.createdDate!)
        : '';

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.dividerColor.withValues(alpha: 0.3)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      poem.title?.isNotEmpty == true
                          ? poem.title!
                          : 'Untitled',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontSize: 18,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      poem.isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: poem.isFavorite
                          ? theme.colorScheme.primary
                          : theme.hintColor,
                      size: 20,
                    ),
                    onPressed: onFavorite,
                  ),
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert, color: theme.hintColor),
                    onSelected: (value) {
                      switch (value) {
                        case 'archive':
                          onArchive?.call();
                        case 'duplicate':
                          onDuplicate?.call();
                        case 'delete':
                          onDelete?.call();
                      }
                    },
                    itemBuilder: (context) => [
                      if (onArchive != null)
                        PopupMenuItem(
                          value: 'archive',
                          child: Text(
                            poem.isArchived ? 'Restore' : 'Archive',
                          ),
                        ),
                      if (onDuplicate != null)
                        const PopupMenuItem(
                          value: 'duplicate',
                          child: Text('Duplicate'),
                        ),
                      if (onDelete != null)
                        const PopupMenuItem(
                          value: 'delete',
                          child: Text('Delete'),
                        ),
                    ],
                  ),
                ],
              ),
              if (short.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  short,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontStyle: FontStyle.italic,
                    color: theme.hintColor,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(date, style: theme.textTheme.labelSmall),
                  if (poem.wordCount > 0) ...[
                    Text(' · ', style: theme.textTheme.labelSmall),
                    Text(
                      '${poem.wordCount} words',
                      style: theme.textTheme.labelSmall,
                    ),
                  ],
                  const Spacer(),
                  if (poem.collection != null && poem.collection!.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        poem.collection!,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
