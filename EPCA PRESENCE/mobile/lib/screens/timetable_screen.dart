import 'package:flutter/material.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';
import 'classroom_timetable_screen.dart';

class TimetableScreen extends StatelessWidget {
  const TimetableScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: EpcaStore.instance,
      builder: (context, _) {
        final store = EpcaStore.instance;
        final hours = store.myHours;
        final byDay = <int, List<ScheduleEntry>>{};
        for (final entry in hours) {
          byDay.putIfAbsent(entry.day, () => []).add(entry);
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Mes heures de cours'),
          ),
          body: hours.isEmpty
              ? const Center(child: Text('Aucun créneau programmé pour le moment.'))
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8FBF1),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF6EE7B7)),
                      ),
                      child: const Text(
                        'Vos créneaux sont surlignés en vert. Touchez un cours pour voir l’emploi du temps complet de la classe.',
                        style: TextStyle(color: Color(0xFF047857), height: 1.4, fontSize: 13),
                      ),
                    ),
                    const SizedBox(height: 14),
                    for (final day in [1, 2, 3, 4, 5])
                      if (byDay[day] != null) ...[
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8, top: 8),
                          child: Text(
                            dayLabels[day]!,
                            style: const TextStyle(fontWeight: FontWeight.w800, color: EpcaColors.navy),
                          ),
                        ),
                        for (final entry in byDay[day]!) _HourTile(entry: entry),
                      ],
                  ],
                ),
        );
      },
    );
  }
}

class _HourTile extends StatelessWidget {
  const _HourTile({required this.entry});
  final ScheduleEntry entry;

  @override
  Widget build(BuildContext context) {
    final store = EpcaStore.instance;
    final classroom = store.classroomOf(entry.classroomId);
    final course = store.courseOf(entry.courseId);
    final slot = defaultSlots[entry.slotIndex];
    final category = store.categoryOf(classroom.categoryId);

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ClassroomTimetableScreen(classroom: classroom)),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFE8FBF1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF34D399), width: 1.4),
        ),
        child: Row(
          children: [
            Container(
              width: 74,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFBBF7D0),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(slot.start, style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF047857))),
                  Text(slot.end, style: const TextStyle(fontSize: 12, color: Color(0xFF059669))),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(course.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 3),
                  Text(
                    '${classroom.name} · ${category.code} · ${classroom.filiere}',
                    style: const TextStyle(fontSize: 12, color: EpcaColors.muted),
                  ),
                  Text(entry.room, style: const TextStyle(fontSize: 12, color: EpcaColors.muted)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF059669)),
          ],
        ),
      ),
    );
  }
}
