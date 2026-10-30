import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets/colored_icon.dart';
import 'attendance_screen.dart';

class QuotaDetailScreen extends StatelessWidget {
  const QuotaDetailScreen({super.key, required this.quota});
  final ModuleQuota quota;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: EpcaStore.instance,
      builder: (context, _) {
        final store = EpcaStore.instance;
        final live = store.myQuotas.firstWhere(
          (item) => item.assignment.courseId == quota.assignment.courseId,
          orElse: () => quota,
        );
        final course = store.courseOf(live.assignment.courseId);
        final items = store.occurrencesFor(live.assignment);
        final taught = items.where((item) => item.taught).toList();
        final missed = items.where(store.teacherMissed).toList();

        return Scaffold(
          appBar: AppBar(title: Text(course.name)),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: EpcaColors.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${live.hoursDone.toStringAsFixed(0)} h effectuées / ${live.hourQuota} h',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${live.hoursLeft.toStringAsFixed(0)} h restantes  ·  ${live.sessionsLeft} séance(s) pour finir le module',
                      style: const TextStyle(color: EpcaColors.muted, fontSize: 13),
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(99),
                      child: LinearProgressIndicator(
                        value: live.progress,
                        minHeight: 8,
                        color: EpcaColors.mint,
                        backgroundColor: EpcaColors.mint.withValues(alpha: 0.14),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              _SectionTitle(
                icon: Icons.check_circle,
                color: EpcaColors.mint,
                label: 'Cours donnés (${taught.length})',
              ),
              if (taught.isEmpty)
                const _EmptyLine(text: 'Aucun appel enregistré pour ce module.')
              else
                for (final item in taught) _OccurrenceTile(item: item, taught: true),
              const SizedBox(height: 16),
              _SectionTitle(
                icon: Icons.event_busy,
                color: EpcaColors.absent,
                label: 'Absences du professeur (${missed.length})',
              ),
              if (missed.isEmpty)
                const _EmptyLine(text: 'Aucune séance manquée sur la période.')
              else
                for (final item in missed) _OccurrenceTile(item: item, taught: false),
            ],
          ),
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.color, required this.label});
  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          ColoredIcon(icon: icon, color: color, size: 16, box: 30),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w800, color: EpcaColors.navy)),
        ],
      ),
    );
  }
}

class _EmptyLine extends StatelessWidget {
  const _EmptyLine({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(text, style: const TextStyle(color: EpcaColors.muted, fontSize: 13)),
    );
  }
}

class _OccurrenceTile extends StatelessWidget {
  const _OccurrenceTile({required this.item, required this.taught});
  final SlotOccurrence item;
  final bool taught;

  @override
  Widget build(BuildContext context) {
    final store = EpcaStore.instance;
    final classroom = store.classroomOf(item.entry.classroomId);
    final slot = defaultSlots[item.entry.slotIndex];
    final when = DateTime.parse(item.date);
    final label = '${dayLabels[when.weekday] ?? ''} ${DateFormat('dd/MM/yyyy').format(when)}';
    final color = taught ? EpcaColors.mint : EpcaColors.absent;

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: taught
          ? () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => AttendanceScreen(
                    classroom: classroom,
                    initialCourseId: item.entry.courseId,
                    initialDate: item.date,
                  ),
                ),
              );
            }
          : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.28)),
        ),
        child: Row(
          children: [
            ColoredIcon(
              icon: taught ? Icons.check_circle : Icons.cancel,
              color: color,
              size: 16,
              box: 32,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(
                    '${slot.label}  ·  ${classroom.name}  ·  ${item.entry.room}',
                    style: const TextStyle(fontSize: 12, color: EpcaColors.muted),
                  ),
                ],
              ),
            ),
            if (taught) const Icon(Icons.chevron_right, color: EpcaColors.muted),
          ],
        ),
      ),
    );
  }
}
