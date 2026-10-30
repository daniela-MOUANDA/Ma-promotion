import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/login_screen.dart';
import 'screens/shell_screen.dart';
import 'screens/splash_screen.dart';
import 'store.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  await EpcaStore.instance.bootstrap();
  runApp(const EpcaApp());
}

class EpcaApp extends StatelessWidget {
  const EpcaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: EpcaStore.instance,
      builder: (context, _) {
        return MaterialApp(
          title: 'EPCA Enseignants',
          debugShowCheckedModeBanner: false,
          theme: EpcaTheme.light(),
          home: const _Root(),
        );
      },
    );
  }
}

class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  bool _splashDone = false;

  @override
  Widget build(BuildContext context) {
    if (!_splashDone) {
      return SplashScreen(onFinished: () => setState(() => _splashDone = true));
    }
    if (EpcaStore.instance.currentTeacher == null) {
      return const LoginScreen();
    }
    return const ShellScreen();
  }
}
