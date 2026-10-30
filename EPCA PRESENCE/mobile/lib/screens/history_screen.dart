import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import '../widgets/colored_icon.dart';
import 'attendance_screen.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: EpcaStore.instance,
      builder: (context, _) {
        final store = EpcaStore.instance;
        final sessions = store.mySessions;

        return Scaffold(
          appBar: AppBar(title: const Text('Historique des appels')),
          body: sessions.isEmpty
              ? const Center(
                  child: Text('Aucun appel enregistré pour le moment.', style: TextStyle(color: EpcaColors.muted)),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 28),
                  itemCount: sessions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final session = sessions[index];
                    final classroom = store.classroomOf(session.classroomId);
                    final course = store.courseOf(session.courseId);
                    final locked = !store.canEditAttendance(session);
                    final reason = store.lockReason(session);
                    final present = session.marks.values.where((item) => item == AttendanceMark.present).length;
                    final absent = session.marks.values.where((item) => item == AttendanceMark.absent).length;
                    final when = DateTime.parse(session.date);
                    final date = '${dayLabels[when.weekday] ?? ''} ${DateFormat('dd/MM/yyyy').format(when)}';
                    final slot = defaultSlots[session.slotIndex.clamp(0, defaultSlots.length - 1)];

                    return InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AttendanceScreen(
                              classroom: classroom,
                              initialCourseId: session.courseId,
                              initialDate: session.date,
                            ),
                          ),
                        );
                      },
                      child: Container(
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
                                ColoredIcon(
                                  icon: locked ? Icons.lock : Icons.edit,
                                  color: locked ? EpcaColors.absent : EpcaColors.mint,
                                  size: 16,
                                  box: 32,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(classroom.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                                      Text(
                                        '${course.code} · ${course.name}',
                                        style: const TextStyle(fontSize: 12, color: EpcaColors.muted),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(locked ? Icons.visibility : Icons.chevron_right, color: EpcaColors.muted),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              '$date  ·  ${slot.label}',
                              style: const TextStyle(fontSize: 12, color: EpcaColors.ink, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                _Pill(text: '$present P', color: EpcaColors.present),
                                const SizedBox(width: 6),
                                _Pill(text: '$absent A', color: EpcaColors.absent),
                                const Spacer(),
                                Text(
                                  locked ? 'Consultation seule' : 'Modifiable',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: locked ? EpcaColors.absent : EpcaColors.mint,
                                  ),
                                ),
                              ],
                            ),
                            if (reason != null) ...[
                              const SizedBox(height: 8),
                              Text(reason, style: const TextStyle(fontSize: 11, color: EpcaColors.muted, height: 1.35)),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, required this.color});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color)),
    );
  }
}
