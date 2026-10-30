import 'package:flutter/material.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';

class ClassroomTimetableScreen extends StatelessWidget {
  const ClassroomTimetableScreen({super.key, required this.classroom});
  final Classroom classroom;

  @override
  Widget build(BuildContext context) {
    final store = EpcaStore.instance;
    final entries = store.classroomHours(classroom.id);
    final category = store.categoryOf(classroom.categoryId);

    return Scaffold(
      appBar: AppBar(
        title: Text(classroom.name),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          Text(
            '${category.code} · ${classroom.filiere} · ${classroom.roomLabel}',
            style: const TextStyle(color: EpcaColors.muted),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFE8FBF1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF6EE7B7)),
            ),
            child: const Row(
              children: [
                Icon(Icons.event_available, size: 16, color: Color(0xFF059669)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Vos heures sont surlignées en vert. Le reste est l’emploi du temps de la classe.',
                    style: TextStyle(fontSize: 12.5, color: Color(0xFF047857), height: 1.35),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          for (final day in [1, 2, 3, 4, 5])
            _DayGrid(
              day: day,
              entries: entries.where((item) => item.day == day).toList(),
            ),
        ],
      ),
    );
  }
}

class _DayGrid extends StatelessWidget {
  const _DayGrid({required this.day, required this.entries});
  final int day;
  final List<ScheduleEntry> entries;

  @override
  Widget build(BuildContext context) {
    final store = EpcaStore.instance;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: EpcaColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(dayLabels[day]!, style: const TextStyle(fontWeight: FontWeight.w800, color: EpcaColors.navy)),
          const SizedBox(height: 10),
          for (var i = 0; i < defaultSlots.length; i++)
            Builder(
              builder: (context) {
                final slot = defaultSlots[i];
                ScheduleEntry? entry;
                for (final item in entries) {
                  if (item.slotIndex == i) entry = item;
                }
                final mine = entry?.teacherId == store.currentTeacher?.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  decoration: BoxDecoration(
                    color: entry == null
                        ? EpcaColors.canvas
                        : mine
                            ? const Color(0xFFE8FBF1)
                            : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: mine ? const Color(0xFF34D399) : EpcaColors.line,
                      width: mine ? 1.4 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 92,
                        child: Text(
                          slot.label,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: mine ? const Color(0xFF047857) : EpcaColors.muted,
                          ),
                        ),
                      ),
                      Expanded(
                        child: entry == null
                            ? const Text('Libre', style: TextStyle(color: EpcaColors.muted))
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    store.courseOf(entry.courseId).name,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: mine ? const Color(0xFF065F46) : EpcaColors.ink,
                                    ),
                                  ),
                                  Text(
                                    '${store.teacherOf(entry.teacherId)?.fullName ?? 'Enseignant'} · ${entry.room}',
                                    style: const TextStyle(fontSize: 12, color: EpcaColors.muted),
                                  ),
                                  if (mine)
                                    const Padding(
                                      padding: EdgeInsets.only(top: 4),
                                      child: Text(
                                        'Votre cours',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF059669),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
