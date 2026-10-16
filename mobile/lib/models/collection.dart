class PoemCollection {
  PoemCollection({
    required this.id,
    required this.name,
    this.color,
    this.createdDate,
  });

  final String id;
  final String name;
  final String? color;
  final DateTime? createdDate;

  factory PoemCollection.fromMap(Map<String, dynamic> map) {
    return PoemCollection(
      id: map['id'] as String,
      name: map['name'] as String? ?? 'Untitled',
      color: map['color'] as String?,
      createdDate: map['created_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int)
          : null,
    );
  }

  factory PoemCollection.fromJson(Map<String, dynamic> json) {
    return PoemCollection(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Untitled',
      color: json['color'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'color': color,
        'created_at':
            createdDate?.millisecondsSinceEpoch ?? DateTime.now().millisecondsSinceEpoch,
      };

  Map<String, dynamic> toExportJson() => {
        'name': name,
        if (color != null) 'color': color,
      };
}
