import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({
    super.key,
    required this.classroom,
    this.initialCourseId,
    this.initialDate,
  });
  final Classroom classroom;
  final String? initialCourseId;
  final String? initialDate;

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  late String _date;
  late String _courseId;
  final Map<String, AttendanceMark> _marks = {};
  final _notes = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _date = widget.initialDate ?? DateFormat('yyyy-MM-dd').format(DateTime.now());
    final courses = EpcaStore.instance.coursesForClassroom(widget.classroom.id);
    _courseId = widget.initialCourseId ?? courses.first.id;
    _load();
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  void _load() {
    final found = EpcaStore.instance.findSession(
      classroomId: widget.classroom.id,
      courseId: _courseId,
      date: _date,
    );
    _marks
      ..clear()
      ..addAll(found?.marks ?? {});
    _notes.text = found?.notes ?? '';
    setState(() {});
  }

  Future<void> _pickDate() async {
    final initial = DateTime.tryParse(_date) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2024),
      lastDate: DateTime.now().add(const Duration(days: 14)),
    );
    if (picked == null) return;
    _date = DateFormat('yyyy-MM-dd').format(picked);
    _load();
  }

  Future<void> _save() async {
    final students = EpcaStore.instance.studentsOf(widget.classroom);
    final missing = students.where((item) => !_marks.containsKey(item.id)).length;
    if (missing > 0) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Appel incomplet'),
          content: Text('$missing élève(s) n’ont pas encore de mention. Enregistrer quand même ?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Continuer l’appel')),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Enregistrer')),
          ],
        ),
      );
      if (ok != true) return;
    }

    final store = EpcaStore.instance;
    final existing = store.findSession(
      classroomId: widget.classroom.id,
      courseId: _courseId,
      date: _date,
    );
    final reason = store.lockReason(
      existing,
      classroomId: widget.classroom.id,
      courseId: _courseId,
      date: _date,
    );
    if (reason != null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: EpcaColors.absent, content: Text(reason)),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await store.saveAttendance(
        AttendanceSession(
          id: existing?.id ?? '${widget.classroom.id}-$_courseId-$_date',
          classroomId: widget.classroom.id,
          courseId: _courseId,
          date: _date,
          marks: Map.of(_marks),
          notes: _notes.text.trim(),
          savedAt: DateTime.now(),
          slotIndex: existing?.slotIndex ??
              store.slotIndexFor(classroomId: widget.classroom.id, courseId: _courseId, date: _date),
          reviewedBySg: existing?.reviewedBySg ?? false,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: EpcaColors.absent, content: Text('$error')),
      );
      return;
    }
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: EpcaColors.navy,
        content: Text('Appel enregistré'),
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final store = EpcaStore.instance;
    final students = store.studentsOf(widget.classroom);
    final courses = store.coursesForClassroom(widget.classroom.id);
    final session = store.findSession(
      classroomId: widget.classroom.id,
      courseId: _courseId,
      date: _date,
    );
    final locked = !store.canEditAttendance(
      session,
      classroomId: widget.classroom.id,
      courseId: _courseId,
      date: _date,
    );
    final lockMessage = store.lockReason(
      session,
      classroomId: widget.classroom.id,
      courseId: _courseId,
      date: _date,
    );
    final present = _marks.values.where((item) => item == AttendanceMark.present).length;
    final absent = _marks.values.where((item) => item == AttendanceMark.absent).length;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.classroom.name),
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        key: ValueKey(_courseId),
                        initialValue: _courseId,
                        decoration: const InputDecoration(labelText: 'Module'),
                        items: [
                          for (final course in courses)
                            DropdownMenuItem(value: course.id, child: Text('${course.code} · ${course.name}')),
                        ],
                        onChanged: (value) {
                          if (value == null) return;
                          _courseId = value;
                          _load();
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 132,
                      child: InkWell(
                        onTap: _pickDate,
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'Date'),
                          child: Text(DateFormat('dd/MM').format(DateTime.parse(_date))),
                        ),
                      ),
                    ),
                  ],
                ),
                if (lockMessage != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      lockMessage,
                      style: const TextStyle(fontSize: 12, color: Color(0xFFBE123C), height: 1.35),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    _CountChip(label: 'P', value: present, color: EpcaColors.present),
                    _CountChip(label: 'A', value: absent, color: EpcaColors.absent),
                    const Spacer(),
                    Text('${_marks.length}/${students.length}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 20),
              itemCount: students.length + 1,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                if (index == students.length) {
                  return TextField(
                    controller: _notes,
                    maxLines: 3,
                    readOnly: locked,
                    decoration: const InputDecoration(
                      labelText: 'Remarque (optionnel)',
                      hintText: 'Absence, incident, observation…',
                    ),
                  );
                }
                final student = students[index];
                final mark = _marks[student.id];
                return Container(
                  padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: EpcaColors.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: const Color(0xFFEEF3FA),
                            child: Text(student.initials, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: EpcaColors.navy)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(student.fullName, style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text(student.number, style: const TextStyle(fontSize: 11, color: EpcaColors.muted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        children: [
                          for (final option in AttendanceMark.values)
                            ChoiceChip(
                              label: Text(option.label),
                              selected: mark == option,
                              selectedColor: _color(option),
                              labelStyle: TextStyle(
                                color: mark == option ? Colors.white : EpcaColors.ink,
                                fontWeight: FontWeight.w800,
                              ),
                              onSelected: locked ? null : (_) => setState(() => _marks[student.id] = option),
                            ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: FilledButton(
            onPressed: (_saving || locked) ? null : _save,
            child: Text(
              locked
                  ? 'Consultation seule'
                  : _saving
                      ? 'Enregistrement…'
                      : 'Enregistrer l’appel',
            ),
          ),
        ),
      ),
    );
  }

  Color _color(AttendanceMark mark) => switch (mark) {
        AttendanceMark.present => EpcaColors.present,
        AttendanceMark.absent => EpcaColors.absent,
      };
}

class _CountChip extends StatelessWidget {
  const _CountChip({required this.label, required this.value, required this.color});
  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Row(
        children: [
          CircleAvatar(radius: 8, backgroundColor: color, child: Text(label, style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.w800))),
          const SizedBox(width: 4),
          Text('$value', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        ],
      ),
    );
  }
}
