import 'package:flutter/material.dart';

import '../store.dart';
import '../theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: 's.mba@epca.ga');
  final _password = TextEditingController();
  bool _obscure = true;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final message = await EpcaStore.instance.login(_email.text, _password.text);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _error = message;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EpcaColors.canvas,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 24),
          children: [
            Center(
              child: Container(
                width: 86,
                height: 86,
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Color(0x14000000), blurRadius: 18, offset: Offset(0, 8)),
                  ],
                ),
                child: ClipOval(child: Image.asset('assets/logo-epca.png')),
              ),
            ),
            const SizedBox(height: 22),
            const Text(
              'Connexion enseignant',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: EpcaColors.ink,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Accédez à vos classes, faites l’appel et consultez vos heures de cours.',
              textAlign: TextAlign.center,
              style: TextStyle(color: EpcaColors.muted, height: 1.45),
            ),
            const SizedBox(height: 28),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autocorrect: false,
              decoration: const InputDecoration(
                labelText: 'E-mail',
                prefixIcon: Icon(Icons.email, color: EpcaColors.sky),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _password,
              obscureText: _obscure,
              onSubmitted: (_) => _submit(),
              decoration: InputDecoration(
                labelText: 'Mot de passe',
                prefixIcon: const Icon(Icons.lock, color: EpcaColors.amber),
                suffixIcon: IconButton(
                  onPressed: () => setState(() => _obscure = !_obscure),
                  icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off, color: EpcaColors.muted),
                ),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF1F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Text(_error!, style: const TextStyle(color: Color(0xFFBE123C), fontWeight: FontWeight.w600)),
              ),
            ],
            const SizedBox(height: 22),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Se connecter'),
            ),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF3FA),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Comptes de démonstration',
                    style: TextStyle(fontWeight: FontWeight.w800, color: EpcaColors.navy),
                  ),
                  SizedBox(height: 8),
                  Text('s.mba@epca.ga  ·  mot de passe epca2026', style: TextStyle(fontSize: 13, color: EpcaColors.muted)),
                  SizedBox(height: 4),
                  Text('p.ogandaga@epca.ga  ·  mot de passe epca2026', style: TextStyle(fontSize: 13, color: EpcaColors.muted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
