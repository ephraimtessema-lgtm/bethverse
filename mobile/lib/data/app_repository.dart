import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../models/collection.dart';
import '../models/poem.dart';

const _uuid = Uuid();

String plainTextToHtml(String plain) {
  return plain
      .split('\n')
      .map((line) => '<p>${line.isEmpty ? '<br>' : line}</p>')
      .join();
}

int countWords(String text) {
  final trimmed = text.trim();
  if (trimmed.isEmpty) return 0;
  return trimmed.split(RegExp(r'\s+')).length;
}

class AppRepository {
  AppRepository(this._db);

  final Database _db;

  static Future<AppRepository> open() async {
    final dir = await getDatabasesPath();
    final path = p.join(dir, 'bethverse.db');
    final db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT,
            created_at INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE poems (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL DEFAULT '',
            plain_text TEXT NOT NULL DEFAULT '',
            collection TEXT,
            is_favorite INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0,
            word_count INTEGER NOT NULL DEFAULT 0,
            char_count INTEGER NOT NULL DEFAULT 0,
            edit_count INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          )
        ''');
      },
    );
    return AppRepository(db);
  }

  // ——— Poems ———

  Future<List<Poem>> listPoems() async {
    final rows = await _db.query('poems', orderBy: 'created_at DESC');
    return rows.map(Poem.fromMap).toList();
  }

  Future<Poem?> getPoem(String id) async {
    final rows = await _db.query('poems', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    return Poem.fromMap(rows.first);
  }

  Future<Poem> createPoem({
    String title = '',
    String plainText = '',
    String? content,
    String? collection,
    bool isFavorite = false,
    bool isArchived = false,
  }) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final id = _uuid.v4();
    final html = content ?? (plainText.isEmpty ? '' : plainTextToHtml(plainText));
    final words = countWords(plainText);
    final poem = Poem(
      id: id,
      title: title,
      content: html,
      plainText: plainText,
      collection: collection,
      isFavorite: isFavorite,
      isArchived: isArchived,
      wordCount: words,
      charCount: plainText.length,
      editCount: 0,
      createdDate: DateTime.fromMillisecondsSinceEpoch(now),
      updatedDate: DateTime.fromMillisecondsSinceEpoch(now),
    );
    await _db.insert('poems', poem.toMap());
    return poem;
  }

  Future<Poem> updatePoem(String id, Map<String, dynamic> fields) async {
    final existing = await getPoem(id);
    if (existing == null) throw StateError('Poem not found');

    final plain = fields['plain_text'] as String? ?? existing.plainText ?? '';
    final title = fields['title'] as String? ?? existing.title ?? '';
    final content =
        fields['content'] as String? ?? existing.content ?? plainTextToHtml(plain);

    final updated = existing.copyWith(
      title: title,
      content: content,
      plainText: plain,
      collection: fields.containsKey('collection')
          ? (fields['collection'] as String?)?.isEmpty == true
              ? null
              : fields['collection'] as String?
          : existing.collection,
      isFavorite: fields['is_favorite'] as bool? ?? existing.isFavorite,
      isArchived: fields['is_archived'] as bool? ?? existing.isArchived,
      wordCount: fields['word_count'] as int? ?? countWords(plain),
      charCount: fields['char_count'] as int? ?? plain.length,
      editCount: fields['edit_count'] as int? ?? existing.editCount,
      updatedDate: DateTime.now(),
    );

    await _db.update('poems', updated.toMap(), where: 'id = ?', whereArgs: [id]);
    return updated;
  }

  Future<void> deletePoem(String id) async {
    await _db.delete('poems', where: 'id = ?', whereArgs: [id]);
  }

  Future<Poem> duplicatePoem(Poem source) async {
    return createPoem(
      title: '${source.title ?? 'Untitled'} (copy)',
      plainText: source.plainText ?? '',
      content: source.content,
      collection: source.collection,
      isFavorite: source.isFavorite,
    );
  }

  // ——— Collections ———

  Future<List<PoemCollection>> listCollections() async {
    final rows = await _db.query('collections', orderBy: 'name ASC');
    return rows.map(PoemCollection.fromMap).toList();
  }

  Future<PoemCollection?> getCollection(String id) async {
    final rows =
        await _db.query('collections', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    return PoemCollection.fromMap(rows.first);
  }

  Future<PoemCollection> createCollection({
    required String name,
    String? color,
  }) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final col = PoemCollection(
      id: _uuid.v4(),
      name: name,
      color: color,
      createdDate: DateTime.fromMillisecondsSinceEpoch(now),
    );
    await _db.insert('collections', col.toMap());
    return col;
  }

  Future<PoemCollection> updateCollection(
    String id, {
    required String name,
    String? color,
  }) async {
    final existing = await getCollection(id);
    if (existing == null) throw StateError('Collection not found');
    final updated = PoemCollection(
      id: id,
      name: name,
      color: color ?? existing.color,
      createdDate: existing.createdDate,
    );
    await _db.update(
      'collections',
      updated.toMap(),
      where: 'id = ?',
      whereArgs: [id],
    );
    return updated;
  }

  Future<void> deleteCollection(String id) async {
    await _db.delete('collections', where: 'id = ?', whereArgs: [id]);
  }

  // ——— Import / export ———

  Future<Map<String, dynamic>> exportAll() async {
    final poems = await listPoems();
    final collections = await listCollections();
    return {
      'poems': poems.map((p) => p.toExportJson()).toList(),
      'collections': collections.map((c) => c.toExportJson()).toList(),
      'exportDate': DateTime.now().toIso8601String(),
      'version': '1.0',
    };
  }

  Future<int> importPoems(List<dynamic> rawPoems) async {
    var count = 0;
    for (final raw in rawPoems) {
      final map = Map<String, dynamic>.from(raw as Map);
      await createPoem(
        title: map['title'] as String? ?? '',
        plainText: map['plain_text'] as String? ?? '',
        content: map['content'] as String?,
        collection: map['collection'] as String?,
        isFavorite: map['is_favorite'] == true,
        isArchived: map['is_archived'] == true,
      );
      count++;
    }
    return count;
  }

  Future<void> importCollections(List<dynamic> raw) async {
    for (final item in raw) {
      final map = Map<String, dynamic>.from(item as Map);
      final name = map['name'] as String? ?? 'Imported';
      final existing = await listCollections();
      if (existing.any((c) => c.name == name)) continue;
      await createCollection(
        name: name,
        color: map['color'] as String?,
      );
    }
  }
}
