class Poem {
  Poem({
    required this.id,
    this.title,
    this.content,
    this.plainText,
    this.collection,
    this.isFavorite = false,
    this.isArchived = false,
    this.wordCount = 0,
    this.charCount = 0,
    this.editCount = 0,
    this.createdDate,
    this.updatedDate,
  });

  final String id;
  final String? title;
  final String? content;
  final String? plainText;
  final String? collection;
  final bool isFavorite;
  final bool isArchived;
  final int wordCount;
  final int charCount;
  final int editCount;
  final DateTime? createdDate;
  final DateTime? updatedDate;

  factory Poem.fromMap(Map<String, dynamic> map) {
    return Poem(
      id: map['id'] as String,
      title: map['title'] as String?,
      content: map['content'] as String?,
      plainText: map['plain_text'] as String?,
      collection: map['collection'] as String?,
      isFavorite: (map['is_favorite'] as int? ?? 0) == 1,
      isArchived: (map['is_archived'] as int? ?? 0) == 1,
      wordCount: map['word_count'] as int? ?? 0,
      charCount: map['char_count'] as int? ?? 0,
      editCount: map['edit_count'] as int? ?? 0,
      createdDate: _fromMillis(map['created_at']),
      updatedDate: _fromMillis(map['updated_at']),
    );
  }

  factory Poem.fromJson(Map<String, dynamic> json) {
    return Poem(
      id: json['id'] as String? ?? '',
      title: json['title'] as String?,
      content: json['content'] as String?,
      plainText: json['plain_text'] as String?,
      collection: json['collection'] as String?,
      isFavorite: json['is_favorite'] == true,
      isArchived: json['is_archived'] == true,
      wordCount: (json['word_count'] as num?)?.toInt() ?? 0,
      charCount: (json['char_count'] as num?)?.toInt() ?? 0,
      editCount: (json['edit_count'] as num?)?.toInt() ?? 0,
      createdDate: _parseIso(json['created_date']),
      updatedDate: _parseIso(json['updated_date']),
    );
  }

  Map<String, dynamic> toMap() {
    final created = createdDate?.millisecondsSinceEpoch ??
        DateTime.now().millisecondsSinceEpoch;
    final updated = updatedDate?.millisecondsSinceEpoch ?? created;
    return {
      'id': id,
      'title': title ?? '',
      'content': content ?? '',
      'plain_text': plainText ?? '',
      'collection': collection,
      'is_favorite': isFavorite ? 1 : 0,
      'is_archived': isArchived ? 1 : 0,
      'word_count': wordCount,
      'char_count': charCount,
      'edit_count': editCount,
      'created_at': created,
      'updated_at': updated,
    };
  }

  Map<String, dynamic> toExportJson() => {
        'title': title,
        'content': content,
        'plain_text': plainText,
        'collection': collection,
        'is_favorite': isFavorite,
        'is_archived': isArchived,
        'word_count': wordCount,
        'char_count': charCount,
      };

  Poem copyWith({
    String? title,
    String? content,
    String? plainText,
    String? collection,
    bool? isFavorite,
    bool? isArchived,
    int? wordCount,
    int? charCount,
    int? editCount,
    DateTime? updatedDate,
  }) {
    return Poem(
      id: id,
      title: title ?? this.title,
      content: content ?? this.content,
      plainText: plainText ?? this.plainText,
      collection: collection ?? this.collection,
      isFavorite: isFavorite ?? this.isFavorite,
      isArchived: isArchived ?? this.isArchived,
      wordCount: wordCount ?? this.wordCount,
      charCount: charCount ?? this.charCount,
      editCount: editCount ?? this.editCount,
      createdDate: createdDate,
      updatedDate: updatedDate ?? this.updatedDate,
    );
  }

  static DateTime? _fromMillis(dynamic value) {
    if (value == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(value as int);
  }

  static DateTime? _parseIso(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString());
  }
}
