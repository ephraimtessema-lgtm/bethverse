import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';

import '../providers/providers.dart';

/// On-device OCR — no network required.
class OcrScreen extends ConsumerStatefulWidget {
  const OcrScreen({super.key});

  @override
  ConsumerState<OcrScreen> createState() => _OcrScreenState();
}

class _OcrScreenState extends ConsumerState<OcrScreen> {
  File? _image;
  String _status = 'idle';
  final _textController = TextEditingController();
  final _recognizer = TextRecognizer();

  @override
  void dispose() {
    _textController.dispose();
    _recognizer.close();
    super.dispose();
  }

  Future<void> _pick(ImageSource source) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: source, imageQuality: 90);
    if (file != null) {
      setState(() {
        _image = File(file.path);
        _status = 'idle';
        _textController.clear();
      });
    }
  }

  Future<void> _extract() async {
    if (_image == null) return;
    setState(() => _status = 'extracting');

    try {
      final inputImage = InputImage.fromFilePath(_image!.path);
      final result = await _recognizer.processImage(inputImage);
      final text = result.text.trim();

      setState(() {
        _textController.text = text;
        _status = 'done';
      });
    } catch (e) {
      setState(() => _status = 'error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not read text: $e')),
        );
      }
    }
  }

  Future<void> _useText() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    final repo = await ref.read(repositoryProvider.future);
    final poem = await repo.createPoem(
      title: 'Extracted Poem',
      plainText: text,
    );
    ref.invalidate(poemsProvider);
    if (mounted) context.go('/editor/${poem.id}');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final busy = _status == 'extracting';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan poem'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Extract text from a photo using on-device recognition. Works fully offline.',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: busy ? null : () => _pick(ImageSource.gallery),
            child: Container(
              height: 180,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: theme.colorScheme.primary.withValues(alpha: 0.3),
                  width: 2,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: _image != null
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.file(_image!, fit: BoxFit.cover),
                        if (busy)
                          Container(
                            color: Colors.black45,
                            child: const Center(
                              child: CircularProgressIndicator(),
                            ),
                          ),
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.image_outlined,
                            size: 40, color: theme.hintColor),
                        const SizedBox(height: 8),
                        Text('Tap to select image',
                            style: TextStyle(color: theme.hintColor)),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pick(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Camera'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pick(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Gallery'),
                ),
              ),
            ],
          ),
          if (_status != 'done') ...[
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _image == null || busy ? null : _extract,
              child: Text(busy ? 'Reading image…' : 'Extract text'),
            ),
          ],
          if (_status == 'done') ...[
            const SizedBox(height: 16),
            TextField(
              controller: _textController,
              maxLines: 12,
              decoration: const InputDecoration(
                hintText: 'Edit extracted text…',
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() {
                      _status = 'idle';
                      _image = null;
                      _textController.clear();
                    }),
                    child: const Text('Retry'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: _useText,
                    child: const Text('Open in editor'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
