import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:local_auth/local_auth.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../models/collection.dart';
import '../models/poem.dart';
import '../providers/providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _pinController = TextEditingController();
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _checkBiometric() async {
    final auth = LocalAuthentication();
    final can = await auth.canCheckBiometrics;
    if (mounted) setState(() => _biometricAvailable = can);
  }

  Future<void> _exportJson() async {
    final repo = await ref.read(repositoryProvider.future);
    final data = await repo.exportAll();
    final dir = await getTemporaryDirectory();
    final file = File(
      '${dir.path}/bethverse-backup-${DateTime.now().toIso8601String().substring(0, 10)}.json',
    );
    await file.writeAsString(const JsonEncoder.withIndent('  ').convert(data));
    await Share.shareXFiles([XFile(file.path)], text: 'BethVerse backup');
  }

  Future<void> _exportTxt(List<Poem> poems) async {
    final lines = poems
        .where((p) => !p.isArchived)
        .map((p) => '${p.title ?? 'Untitled'}\n${'—' * 30}\n${p.plainText ?? ''}\n')
        .join('\n');
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/bethverse-poems.txt');
    await file.writeAsString(lines);
    await Share.shareXFiles([XFile(file.path)]);
  }

  Future<void> _importBackup() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );
    if (result == null || result.files.single.path == null) return;

    final text = await File(result.files.single.path!).readAsString();
    final data = jsonDecode(text) as Map<String, dynamic>;
    final repo = await ref.read(repositoryProvider.future);
    final poems = data['poems'] as List<dynamic>?;
    if (poems != null) {
      final count = await repo.importPoems(poems);
      final cols = data['collections'] as List<dynamic>?;
      if (cols != null) await repo.importCollections(cols);
      ref.invalidate(poemsProvider);
      ref.invalidate(collectionsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Imported $count poems')),
        );
      }
    }
  }

  void _showPinDialog(String mode) {
    _pinController.clear();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          mode == 'set'
              ? 'Set PIN'
              : mode == 'change'
                  ? 'Change PIN'
                  : 'Disable PIN',
        ),
        content: TextField(
          controller: _pinController,
          keyboardType: TextInputType.number,
          obscureText: true,
          maxLength: 6,
          decoration: const InputDecoration(
            labelText: '4–6 digit PIN',
            counterText: '',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              if (mode == 'disable') {
                await ref.read(pinLockProvider.notifier).removePin();
              } else if (_pinController.text.length >= 4) {
                await ref.read(pinLockProvider.notifier).savePin(_pinController.text);
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: Text(mode == 'disable' ? 'Remove' : 'Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final fontStyle = ref.watch(fontStyleProvider);
    final pinState = ref.watch(pinLockProvider);
    final poemsAsync = ref.watch(poemsProvider);
    final collectionsAsync = ref.watch(collectionsProvider);

    final poems = poemsAsync.valueOrNull ?? [];
    final collections = collectionsAsync.valueOrNull ?? [];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
      children: [
        Text(
          'Settings',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                fontSize: 26,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 24),
        _sectionTitle('Appearance'),
        _group([
          const ListTile(title: Text('Theme')),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SegmentedButton<ThemeMode>(
              segments: const [
                ButtonSegment(value: ThemeMode.light, label: Text('Light')),
                ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
                ButtonSegment(value: ThemeMode.system, label: Text('System')),
              ],
              selected: {themeMode},
              onSelectionChanged: (s) {
                final mode = switch (s.first) {
                  ThemeMode.light => 'light',
                  ThemeMode.dark => 'dark',
                  _ => 'system',
                };
                ref.read(themeModeProvider.notifier).setMode(mode);
              },
            ),
          ),
          const ListTile(title: Text('Font style')),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'serif', label: Text('Serif')),
                ButtonSegment(value: 'modern', label: Text('Modern')),
                ButtonSegment(value: 'classic', label: Text('Classic')),
              ],
              selected: {fontStyle},
              onSelectionChanged: (s) =>
                  ref.read(fontStyleProvider.notifier).setStyle(s.first),
            ),
          ),
        ]),
        _sectionTitle('Security'),
        _group([
          if (pinState.pin == null)
            ListTile(
              leading: const Icon(Icons.lock_outline),
              title: const Text('Set PIN Lock'),
              subtitle: const Text('Protect your vault with a PIN'),
              onTap: () => _showPinDialog('set'),
            )
          else ...[
            ListTile(
              leading: const Icon(Icons.pin),
              title: const Text('Change PIN'),
              onTap: () => _showPinDialog('change'),
            ),
            ListTile(
              leading: const Icon(Icons.lock_open),
              title: const Text('Disable PIN'),
              onTap: () => _showPinDialog('disable'),
            ),
            if (_biometricAvailable)
              SwitchListTile(
                secondary: const Icon(Icons.fingerprint),
                title: const Text('Biometric unlock'),
                value: pinState.biometricEnabled,
                onChanged: (v) =>
                    ref.read(pinLockProvider.notifier).setBiometric(v),
              ),
          ],
        ]),
        _sectionTitle('Scan text'),
        _group([
          ListTile(
            leading: const Icon(Icons.document_scanner_outlined),
            title: const Text('Scan poem from image'),
            subtitle: const Text('On-device OCR, works offline'),
            onTap: () => context.push('/ocr'),
          ),
        ]),
        _sectionTitle('Backup'),
        _group([
          ListTile(
            leading: const Icon(Icons.upload_file),
            title: const Text('Export JSON'),
            onTap: _exportJson,
          ),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('Export as text'),
            onTap: () => _exportTxt(poems),
          ),
          ListTile(
            leading: const Icon(Icons.download),
            title: const Text('Import backup'),
            onTap: _importBackup,
          ),
        ]),
        _sectionTitle('Storage'),
        _group([
          ListTile(
            title: const Text('Total poems'),
            trailing: Text('${poems.length}'),
          ),
          ListTile(
            title: const Text('Collections'),
            trailing: Text('${collections.length}'),
          ),
          ListTile(
            title: const Text('Total words'),
            trailing: Text(
              '${poems.fold<int>(0, (s, p) => s + p.wordCount)}',
            ),
          ),
        ]),
        const SizedBox(height: 32),
        Center(
          child: Column(
            children: [
              Text(
                'BethVerse',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              Text(
                'Offline · all data stored on this device',
                style: Theme.of(context).textTheme.labelSmall,
              ),
              Text(
                'Version 1.0',
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 8),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
            ),
      ),
    );
  }

  Widget _group(List<Widget> children) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(children: children),
    );
  }
}
