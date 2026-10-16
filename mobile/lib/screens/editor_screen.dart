import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/app_repository.dart';
import '../models/poem.dart';
import '../models/collection.dart';
import '../providers/providers.dart';

class EditorScreen extends ConsumerStatefulWidget {
  const EditorScreen({super.key, required this.poemId});

  final String poemId;

  @override
  ConsumerState<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends ConsumerState<EditorScreen> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  Timer? _saveTimer;
  bool _isSaving = false;
  bool _hasChanges = false;
  Poem? _poem;

  @override
  void dispose() {
    _saveTimer?.cancel();
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  int get _wordCount {
    final text = _bodyController.text.trim();
    if (text.isEmpty) return 0;
    return text.split(RegExp(r'\s+')).length;
  }

  int get _charCount => _bodyController.text.length;

  int get _readingTime => (_wordCount / 200).ceil().clamp(1, 9999);

  void _scheduleSave() {
    _hasChanges = true;
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(seconds: 2), _save);
  }

  Future<void> _save() async {
    if (_poem == null) return;
    setState(() => _isSaving = true);
    final plain = _bodyController.text;

    try {
      final repo = await ref.read(repositoryProvider.future);
      final updated = await repo.updatePoem(widget.poemId, {
        'title': _titleController.text,
        'content': plainTextToHtml(plain),
        'plain_text': plain,
        'word_count': _wordCount,
        'char_count': _charCount,
        'edit_count': (_poem!.editCount) + 1,
        'collection': _poem!.collection,
        'is_favorite': _poem!.isFavorite,
        'is_archived': _poem!.isArchived,
      });
      setState(() => _poem = updated);
      ref.invalidate(poemsProvider);
      if (mounted) {
        setState(() {
        _hasChanges = false;
        _isSaving = false;
      });
      }
    } catch (_) {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _toggleFavorite() async {
    if (_poem == null) return;
    final repo = await ref.read(repositoryProvider.future);
    final updated = await repo.updatePoem(widget.poemId, {
      'is_favorite': !_poem!.isFavorite,
    });
    setState(() => _poem = updated);
    ref.invalidate(poemsProvider);
  }

  Future<void> _setCollection(String? name) async {
    if (_poem == null) return;
    final repo = await ref.read(repositoryProvider.future);
    final updated = await repo.updatePoem(widget.poemId, {'collection': name});
    setState(() => _poem = updated);
    ref.invalidate(poemsProvider);
  }

  Future<void> _loadPoem() async {
    final repo = await ref.read(repositoryProvider.future);
    final poem = await repo.getPoem(widget.poemId);
    if (poem == null) return;
    setState(() {
      _poem = poem;
      _titleController.text = poem.title ?? '';
      _bodyController.text = poem.plainText ?? '';
    });
  }

  @override
  void initState() {
    super.initState();
    _loadPoem();
    _titleController.addListener(_scheduleSave);
    _bodyController.addListener(_scheduleSave);
  }

  @override
  Widget build(BuildContext context) {
    final collectionsAsync = ref.watch(collectionsProvider);
    final theme = Theme.of(context);

    if (_poem == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop && _hasChanges) _save();
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              if (_hasChanges) _save();
              context.pop();
            },
          ),
          title: Text(
            _isSaving
                ? 'Saving…'
                : _hasChanges
                    ? 'Unsaved'
                    : 'Saved',
            style: theme.textTheme.labelSmall,
          ),
          actions: [
            IconButton(
              onPressed: _toggleFavorite,
              icon: Icon(
                _poem!.isFavorite ? Icons.favorite : Icons.favorite_border,
                color: _poem!.isFavorite ? theme.colorScheme.primary : null,
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            collectionsAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (collections) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: DropdownButtonFormField<String?>(
                    value: _poem!.collection?.isEmpty == true
                        ? null
                        : _poem!.collection,
                    decoration: const InputDecoration(
                      labelText: 'Collection',
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem<String?>(
                        value: null,
                        child: Text('No collection'),
                      ),
                      ...collections.map(
                        (c) => DropdownMenuItem(
                          value: c.name,
                          child: Text(c.name),
                        ),
                      ),
                    ],
                    onChanged: _setCollection,
                  ),
                );
              },
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    TextField(
                      controller: _titleController,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Poem title',
                        border: InputBorder.none,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _bodyController,
                      maxLines: null,
                      minLines: 16,
                      style: theme.textTheme.bodyLarge,
                      decoration: const InputDecoration(
                        hintText: 'Begin writing your verse…',
                        border: InputBorder.none,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: theme.dividerColor)),
              ),
              child: Row(
                children: [
                  Text(
                    '$_wordCount words · $_charCount chars · ~$_readingTime min',
                    style: theme.textTheme.labelSmall,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
