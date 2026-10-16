import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:bethverse/main.dart';

void main() {
  testWidgets('BethVerse app loads', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: BethVerseApp()));
    await tester.pumpAndSettle();
    expect(find.text('BethVerse'), findsWidgets);
  });
}
