import 'package:flutter/material.dart';

class PoemSearchBar extends StatelessWidget {
  const PoemSearchBar({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: 'Search poems…',
        prefixIcon: const Icon(Icons.search, size: 20),
        suffixIcon: value.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear, size: 18),
                onPressed: () => onChanged(''),
              )
            : null,
      ),
    );
  }
}
