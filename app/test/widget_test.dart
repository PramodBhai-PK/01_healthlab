import 'package:flutter_test/flutter_test.dart';
import 'package:app/main.dart';

void main() {
  testWidgets('HealthLabApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HealthLabApp());
    await tester.pump(const Duration(seconds: 3));
    expect(find.byType(HealthLabApp), findsOneWidget);
  });
}
