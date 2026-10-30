import 'package:flutter/material.dart';

import '../theme.dart';
import '../widgets/logo_ripples.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key, required this.onFinished});

  final VoidCallback onFinished;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EpcaColors.navy,
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF16345C), Color(0xFF0B1F3A)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              children: [
                const Spacer(flex: 2),
                SizedBox(
                  height: 240,
                  child: Stack(
                    alignment: Alignment.center,
                    clipBehavior: Clip.none,
                    children: [
                      const OverflowBox(
                        maxWidth: 720,
                        maxHeight: 720,
                        child: LogoRipples(),
                      ),
                      Container(
                        width: 118,
                        height: 118,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: EpcaColors.fluo.withValues(alpha: 0.28),
                              blurRadius: 28,
                              spreadRadius: 2,
                            ),
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.25),
                              blurRadius: 28,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Image.asset('assets/logo-epca.png', fit: BoxFit.contain),
                        ),
                      ),
                    ],
                  ),
                ),
                const Text(
                  'EPCA',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 6,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'École de Préparation aux\nCarrières Administratives',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.72),
                    height: 1.45,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                  ),
                  child: const Text(
                    'ESPACE ENSEIGNANTS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.8,
                    ),
                  ),
                ),
                const Spacer(flex: 2),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: EpcaColors.fluo.withValues(alpha: 0.14),
                      side: BorderSide(color: EpcaColors.fluo.withValues(alpha: 0.9), width: 1.5),
                      minimumSize: const Size.fromHeight(52),
                      shape: const StadiumBorder(),
                    ),
                    onPressed: onFinished,
                    child: const Text(
                      'CONNEXION',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.8,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 22),
                Container(
                  width: 42,
                  height: 1.4,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.28),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Gabon',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                    letterSpacing: 3,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
