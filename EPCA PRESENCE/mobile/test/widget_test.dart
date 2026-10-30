import 'package:flutter_test/flutter_test.dart';
import 'package:epca_mobile/store.dart';

void main() {
  test('comptes enseignants de démonstration', () {
    expect(EpcaStore.instance.teachers.length, 2);
    expect(EpcaStore.instance.teachers.first.email, 's.mba@epca.ga');
  });
}
