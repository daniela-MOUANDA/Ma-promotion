import 'package:flutter/material.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets/colored_icon.dart';
import '../widgets/teacher_avatar.dart';
import 'attendance_screen.dart';
import 'classroom_timetable_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'quota_detail_screen.dart';

class ClassesScreen extends StatelessWidget {
  const ClassesScreen({super.key, this.onOpenProfile, this.onOpenHistory});

  final VoidCallback? onOpenProfile;
  final VoidCallback? onOpenHistory;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: EpcaStore.instance,
      builder: (context, _) {
        final store = EpcaStore.instance;
        final teacher = store.currentTeacher!;
        final grouped = <String, List<Classroom>>{};
        for (final classroom in store.myClassrooms) {
          grouped.putIfAbsent(classroom.categoryId, () => []).add(classroom);
        }
        final ordered = categories.where((item) => grouped.containsKey(item.id)).toList();
        final quotas = store.myQuotas;

        return Scaffold(
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bonjour, ${teacher.firstNames}',
                  style: const TextStyle(fontSize: 13, color: EpcaColors.muted, fontWeight: FontWeight.w500),
                ),
                const Text('Mes classes'),
              ],
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 14),
                child: TeacherAvatar(
                  teacher: teacher,
                  radius: 18,
                  onTap: onOpenProfile ??
                      () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => ProfileScreen(teacher: teacher)),
                        );
                      },
                ),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              Row(
                children: [
                  _MiniStat(
                    icon: Icons.groups,
                    color: EpcaColors.sky,
                    label: 'Classes',
                    value: '${store.myClassrooms.length}',
                  ),
                  const SizedBox(width: 10),
                  _MiniStat(
                    icon: Icons.menu_book,
                    color: EpcaColors.amber,
                    label: 'Cours',
                    value: '${store.myAssignments.length}',
                  ),
                  const SizedBox(width: 10),
                  _MiniStat(
                    icon: Icons.schedule,
                    color: EpcaColors.mint,
                    label: 'Heures / sem.',
                    value: '${store.myHours.length}',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _HistoryShortcut(count: store.mySessions.length, onOpen: onOpenHistory),
              const SizedBox(height: 16),
              const Text(
                'Quota horaire',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: EpcaColors.navy, letterSpacing: 0.3),
              ),
              const SizedBox(height: 8),
              for (final quota in quotas) _QuotaCard(quota: quota),
              const SizedBox(height: 10),
              for (final category in ordered) ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: 8, top: 6),
                  child: Text(
                    'Catégorie ${category.code}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: EpcaColors.navy,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
                for (final classroom in grouped[category.id]!)
                  _ClassroomCard(classroom: classroom),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
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
    return Expanded(
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 12, 10, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: EpcaColors.line),
        ),
        child: Column(
          children: [
            ColoredIcon(icon: icon, color: color, size: 18, box: 34),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, color: EpcaColors.muted)),
          ],
        ),
      ),
    );
  }
}

class _HistoryShortcut extends StatelessWidget {
  const _HistoryShortcut({required this.count, this.onOpen});
  final int count;
  final VoidCallback? onOpen;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onOpen ??
          () {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const HistoryScreen()));
          },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: EpcaColors.line),
        ),
        child: Row(
          children: [
            const ColoredIcon(icon: Icons.history, color: Color(0xFF7C3AED), size: 18, box: 38),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Historique des appels', style: TextStyle(fontWeight: FontWeight.w800)),
                  Text(
                    count == 0 ? 'Aucun appel enregistré' : '$count séance(s) enregistrée(s)',
                    style: const TextStyle(fontSize: 12, color: EpcaColors.muted),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: EpcaColors.muted),
          ],
        ),
      ),
    );
  }
}

class _QuotaCard extends StatelessWidget {
  const _QuotaCard({required this.quota});
  final ModuleQuota quota;

  @override
  Widget build(BuildContext context) {
    final store = EpcaStore.instance;
    final course = store.courseOf(quota.assignment.courseId);
    final color = quota.hoursLeft <= 4 ? EpcaColors.absent : EpcaColors.mint;

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => QuotaDetailScreen(quota: quota)),
        );
      },
      child: Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: EpcaColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ColoredIcon(icon: Icons.access_time, color: color, size: 18, box: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(course.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                    Text(course.code, style: const TextStyle(fontSize: 12, color: EpcaColors.muted)),
                  ],
                ),
              ),
              Text(
                '${quota.hoursDone.toStringAsFixed(0)} / ${quota.hourQuota} h',
                style: TextStyle(fontWeight: FontWeight.w800, color: color),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: EpcaColors.muted),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: quota.progress,
              minHeight: 7,
              color: color,
              backgroundColor: color.withValues(alpha: 0.14),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${quota.hoursLeft.toStringAsFixed(0)} h restantes  ·  ${quota.sessionsLeft} séance(s) pour finir le module',
            style: const TextStyle(fontSize: 12, color: EpcaColors.muted),
          ),
        ],
      ),
    ),
    );
  }
}

class _ClassroomCard extends StatelessWidget {
  const _ClassroomCard({required this.classroom});
  final Classroom classroom;

  @override
  Widget build(BuildContext context) {
    final store = EpcaStore.instance;
    final category = store.categoryOf(classroom.categoryId);
    final courses = store.coursesForClassroom(classroom.id);
    final occupancy = classroom.studentIds.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: EpcaColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: EpcaColors.navy,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(category.code, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11)),
              ),
              const SizedBox(width: 8),
              Text(classroom.filiere, style: const TextStyle(color: EpcaColors.muted, fontWeight: FontWeight.w600, fontSize: 12)),
              const Spacer(),
              const ColoredIcon(icon: Icons.meeting_room, color: EpcaColors.sky, size: 14, box: 26),
              const SizedBox(width: 6),
              Text(classroom.roomLabel, style: const TextStyle(fontSize: 12, color: EpcaColors.muted)),
            ],
          ),
          const SizedBox(height: 10),
          Text(classroom.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: EpcaColors.ink)),
          const SizedBox(height: 6),
          Text(
            '$occupancy / ${classroom.quota} élèves',
            style: const TextStyle(color: EpcaColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 10),
          for (final course in courses)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  const ColoredIcon(icon: Icons.menu_book, color: EpcaColors.amber, size: 14, box: 26),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      course.name,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: EpcaColors.ink),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton.tonal(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFEEF3FA),
                    foregroundColor: EpcaColors.navy,
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ClassroomTimetableScreen(classroom: classroom),
                      ),
                    );
                  },
                  child: const Text('Emploi du temps'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => AttendanceScreen(classroom: classroom)),
                    );
                  },
                  child: const Text('Faire l’appel'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
