import 'package:flutter/material.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets/colored_icon.dart';
import '../widgets/teacher_avatar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.teacher});
  final TeacherAccount teacher;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: EpcaStore.instance,
      builder: (context, _) {
        final store = EpcaStore.instance;
        return Scaffold(
          appBar: AppBar(title: const Text('Profil')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: EpcaColors.navy,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    TeacherAvatar(
                      teacher: teacher,
                      radius: 32,
                      showCameraBadge: true,
                      onTap: () => pickTeacherPhoto(context, teacher),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(teacher.fullName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
                          const SizedBox(height: 4),
                          Text(teacher.specialty, style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () => pickTeacherPhoto(context, teacher),
                            child: Text(
                              'Ajouter ou changer la photo',
                              style: TextStyle(
                                color: EpcaColors.fluo.withValues(alpha: 0.95),
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              _Info(icon: Icons.email, color: EpcaColors.sky, label: 'E-mail', value: teacher.email),
              _Info(icon: Icons.phone, color: EpcaColors.mint, label: 'Téléphone', value: teacher.phone),
              _Info(icon: Icons.groups, color: EpcaColors.amber, label: 'Classes tenues', value: '${store.myClassrooms.length}'),
              _Info(icon: Icons.event, color: const Color(0xFF7C3AED), label: 'Créneaux cette semaine', value: '${store.myHours.length}'),
              const SizedBox(height: 18),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: EpcaColors.absent,
                  side: const BorderSide(color: Color(0xFFFECACA)),
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => store.logout(),
                child: const Text('Se déconnecter'),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _Info extends StatelessWidget {
  const _Info({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: EpcaColors.line),
      ),
      child: Row(
        children: [
          ColoredIcon(icon: icon, color: color, size: 16, box: 32),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(color: EpcaColors.muted)),
          const Spacer(),
          Flexible(child: Text(value, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }
}
