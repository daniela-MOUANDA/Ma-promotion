import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

const dayLabels = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
};

const defaultSlots = [
  ScheduleSlot(start: '08:00', end: '10:00'),
  ScheduleSlot(start: '10:15', end: '12:15'),
  ScheduleSlot(start: '14:00', end: '16:00'),
  ScheduleSlot(start: '16:15', end: '18:15'),
];

const categories = [
  CategoryInfo(id: 'cat-c2', code: 'C2', name: 'Catégorie C2'),
  CategoryInfo(id: 'cat-c1', code: 'C1', name: 'Catégorie C1'),
  CategoryInfo(id: 'cat-b2', code: 'B2', name: 'Catégorie B2'),
  CategoryInfo(id: 'cat-b1', code: 'B1', name: 'Catégorie B1'),
  CategoryInfo(id: 'cat-a2', code: 'A2', name: 'Catégorie A2'),
];

class EpcaStore extends ChangeNotifier {
  EpcaStore._();
  static final instance = EpcaStore._();

  static const _sessionKey = 'epca.teacher.session';
  static const _attendanceKey = 'epca.teacher.attendance.v2';
  static const _photoKey = 'epca.teacher.photos';

  TeacherAccount? currentTeacher;
  bool ready = false;
  final Map<String, String> photoPaths = {};

  final teachers = const [
    TeacherAccount(
      id: 'tch-mba',
      lastName: 'MBA',
      firstNames: 'Sylvie',
      email: 's.mba@epca.ga',
      password: 'epca2026',
      phone: '+241 66 00 11 22',
      specialty: 'Organisation administrative',
    ),
    TeacherAccount(
      id: 'tch-ogandaga',
      lastName: 'OGANDAGA',
      firstNames: 'Pierre',
      email: 'p.ogandaga@epca.ga',
      password: 'epca2026',
      phone: '+241 66 00 33 44',
      specialty: 'Droit administratif',
    ),
  ];

  final courses = const [
    Course(id: 'crs-org', code: 'ORG-01', name: 'Organisation administrative'),
    Course(id: 'crs-droit', code: 'DRT-01', name: 'Droit administratif'),
    Course(id: 'crs-fin', code: 'FIN-01', name: 'Finances publiques'),
  ];

  late final List<Student> students;
  late final List<Classroom> classrooms;
  late final List<TeachingAssignment> assignments;
  late final List<ScheduleEntry> timetable;
  final List<AttendanceSession> sessions = [];

  Future<void> bootstrap() async {
    _seed();
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString(_sessionKey);
    if (email != null) currentTeacher = _teacherByEmail(email);
    final photos = prefs.getString(_photoKey);
    if (photos != null) {
      try {
        photoPaths.addAll(Map<String, String>.from(jsonDecode(photos) as Map));
      } catch (_) {}
    }
    _restoreAttendance(prefs.getString(_attendanceKey));
    if (sessions.isEmpty) {
      _seedHistory();
      await _persistAttendance();
    }
    ready = true;
    notifyListeners();
  }

  void _seed() {
    students = [
      const Student(id: 'st-01', lastName: 'NDONG', firstNames: 'Marie Claire', number: 'EPCA-2026-CAND-000011'),
      const Student(id: 'st-02', lastName: 'MOUSSOUNDA', firstNames: 'Daniela', number: 'EPCA-2026-CAND-000001'),
      const Student(id: 'st-03', lastName: 'OBAME', firstNames: 'Jean-Paul', number: 'EPCA-2026-CAND-000018'),
      const Student(id: 'st-04', lastName: 'NZIGOU', firstNames: 'Bénédicte', number: 'EPCA-2026-CAND-000022'),
      const Student(id: 'st-05', lastName: 'MBOUMBA', firstNames: 'André', number: 'EPCA-2026-CAND-000027'),
      const Student(id: 'st-06', lastName: 'ELLA', firstNames: 'Prisca', number: 'EPCA-2026-CAND-000031'),
      const Student(id: 'st-07', lastName: 'BINGO', firstNames: 'Stephane', number: 'EPCA-2026-CAND-000035'),
      const Student(id: 'st-08', lastName: 'KOUMBA', firstNames: 'Aline', number: 'EPCA-2026-CAND-000039'),
      const Student(id: 'st-09', lastName: 'OYANE', firstNames: 'Michel', number: 'EPCA-2026-CAND-000041'),
      const Student(id: 'st-10', lastName: 'NGOUA', firstNames: 'Christelle', number: 'EPCA-2026-CAND-000044'),
      const Student(id: 'st-11', lastName: 'MINTSA', firstNames: 'Rodrigue', number: 'EPCA-2026-CAND-000048'),
      const Student(id: 'st-12', lastName: 'ANGWE', firstNames: 'Leslie', number: 'EPCA-2026-CAND-000052'),
      const Student(id: 'st-13', lastName: 'IBINGA', firstNames: 'Patrick', number: 'EPCA-2026-CAND-000055'),
      const Student(id: 'st-14', lastName: 'MOUTSINGA', firstNames: 'Sandra', number: 'EPCA-2026-CAND-000058'),
      const Student(id: 'st-15', lastName: 'ONDO', firstNames: 'Fabrice', number: 'EPCA-2026-CAND-000061'),
      const Student(id: 'st-16', lastName: 'MEZUI', firstNames: 'Ornella', number: 'EPCA-2026-CAND-000064'),
    ];

    classrooms = [
      Classroom(
        id: 'cls-douanes',
        name: 'Classe B1 Douanes 1',
        roomLabel: 'Salle 12',
        categoryId: 'cat-b1',
        filiere: 'Douanes',
        quota: 30,
        studentIds: students.take(10).map((item) => item.id).toList(),
      ),
      Classroom(
        id: 'cls-impots',
        name: 'Classe A2 Impôts 1',
        roomLabel: 'Salle 8',
        categoryId: 'cat-a2',
        filiere: 'Impôts',
        quota: 25,
        studentIds: students.skip(10).map((item) => item.id).toList(),
      ),
      Classroom(
        id: 'cls-admin',
        name: 'Classe B2 Administration 1',
        roomLabel: 'Salle 4',
        categoryId: 'cat-b2',
        filiere: 'Administration générale',
        quota: 28,
        studentIds: [students[2].id, students[5].id, students[8].id, students[11].id, students[14].id],
      ),
    ];

    assignments = const [
      TeachingAssignment(
        teacherId: 'tch-mba',
        courseId: 'crs-org',
        classroomIds: ['cls-douanes', 'cls-impots'],
        hourQuota: 40,
      ),
      TeachingAssignment(
        teacherId: 'tch-mba',
        courseId: 'crs-fin',
        classroomIds: ['cls-impots'],
        hourQuota: 24,
      ),
      TeachingAssignment(
        teacherId: 'tch-ogandaga',
        courseId: 'crs-droit',
        classroomIds: ['cls-douanes', 'cls-admin'],
        hourQuota: 36,
      ),
    ];

    timetable = const [
      ScheduleEntry(id: 'e1', classroomId: 'cls-douanes', day: 1, slotIndex: 0, courseId: 'crs-org', teacherId: 'tch-mba', room: 'Salle 12'),
      ScheduleEntry(id: 'e2', classroomId: 'cls-douanes', day: 1, slotIndex: 2, courseId: 'crs-droit', teacherId: 'tch-ogandaga', room: 'Salle 12'),
      ScheduleEntry(id: 'e3', classroomId: 'cls-impots', day: 1, slotIndex: 1, courseId: 'crs-org', teacherId: 'tch-mba', room: 'Salle 8'),
      ScheduleEntry(id: 'e4', classroomId: 'cls-douanes', day: 2, slotIndex: 1, courseId: 'crs-droit', teacherId: 'tch-ogandaga', room: 'Salle 12'),
      ScheduleEntry(id: 'e5', classroomId: 'cls-impots', day: 2, slotIndex: 0, courseId: 'crs-fin', teacherId: 'tch-mba', room: 'Salle 8'),
      ScheduleEntry(id: 'e6', classroomId: 'cls-admin', day: 2, slotIndex: 3, courseId: 'crs-droit', teacherId: 'tch-ogandaga', room: 'Salle 4'),
      ScheduleEntry(id: 'e7', classroomId: 'cls-douanes', day: 3, slotIndex: 0, courseId: 'crs-org', teacherId: 'tch-mba', room: 'Salle 12'),
      ScheduleEntry(id: 'e8', classroomId: 'cls-impots', day: 3, slotIndex: 2, courseId: 'crs-org', teacherId: 'tch-mba', room: 'Salle 8'),
      ScheduleEntry(id: 'e9', classroomId: 'cls-admin', day: 3, slotIndex: 1, courseId: 'crs-droit', teacherId: 'tch-ogandaga', room: 'Salle 4'),
      ScheduleEntry(id: 'e10', classroomId: 'cls-impots', day: 4, slotIndex: 0, courseId: 'crs-fin', teacherId: 'tch-mba', room: 'Salle 8'),
      ScheduleEntry(id: 'e11', classroomId: 'cls-douanes', day: 4, slotIndex: 2, courseId: 'crs-droit', teacherId: 'tch-ogandaga', room: 'Salle 12'),
      ScheduleEntry(id: 'e12', classroomId: 'cls-admin', day: 4, slotIndex: 3, courseId: 'crs-droit', teacherId: 'tch-ogandaga', room: 'Salle 4'),
      ScheduleEntry(id: 'e13', classroomId: 'cls-douanes', day: 5, slotIndex: 1, courseId: 'crs-org', teacherId: 'tch-mba', room: 'Salle 12'),
      ScheduleEntry(id: 'e14', classroomId: 'cls-impots', day: 5, slotIndex: 3, courseId: 'crs-fin', teacherId: 'tch-mba', room: 'Salle 8'),
      ScheduleEntry(id: 'e15', classroomId: 'cls-admin', day: 5, slotIndex: 0, courseId: 'crs-droit', teacherId: 'tch-ogandaga', room: 'Salle 4'),
    ];
  }

  CategoryInfo categoryOf(String id) =>
      categories.firstWhere((item) => item.id == id, orElse: () => categories.last);

  Course courseOf(String id) => courses.firstWhere((item) => item.id == id);

  Classroom classroomOf(String id) => classrooms.firstWhere((item) => item.id == id);

  Student studentOf(String id) => students.firstWhere((item) => item.id == id);

  List<Student> studentsOf(Classroom classroom) =>
      classroom.studentIds.map(studentOf).toList()
        ..sort((a, b) => a.fullName.compareTo(b.fullName));

  List<TeachingAssignment> get myAssignments {
    final id = currentTeacher?.id;
    if (id == null) return const [];
    return assignments.where((item) => item.teacherId == id).toList();
  }

  List<Classroom> get myClassrooms {
    final ids = myAssignments.expand((item) => item.classroomIds).toSet();
    return classrooms.where((item) => ids.contains(item.id)).toList();
  }

  List<Course> coursesForClassroom(String classroomId) {
    final ids = myAssignments
        .where((item) => item.classroomIds.contains(classroomId))
        .map((item) => item.courseId)
        .toSet();
    return courses.where((item) => ids.contains(item.id)).toList();
  }

  List<ScheduleEntry> get myHours {
    final id = currentTeacher?.id;
    if (id == null) return const [];
    final items = timetable.where((item) => item.teacherId == id).toList()
      ..sort((a, b) {
        final byDay = a.day.compareTo(b.day);
        return byDay != 0 ? byDay : a.slotIndex.compareTo(b.slotIndex);
      });
    return items;
  }

  List<ScheduleEntry> classroomHours(String classroomId) {
    final items = timetable.where((item) => item.classroomId == classroomId).toList()
      ..sort((a, b) {
        final byDay = a.day.compareTo(b.day);
        return byDay != 0 ? byDay : a.slotIndex.compareTo(b.slotIndex);
      });
    return items;
  }

  AttendanceSession? findSession({
    required String classroomId,
    required String courseId,
    required String date,
  }) {
    try {
      return sessions.firstWhere(
        (item) =>
            item.classroomId == classroomId && item.courseId == courseId && item.date == date,
      );
    } catch (_) {
      return null;
    }
  }

  List<AttendanceSession> get mySessions {
    final ids = myAssignments.map((item) => item.courseId).toSet();
    final rooms = myClassrooms.map((item) => item.id).toSet();
    final items = sessions
        .where((item) => ids.contains(item.courseId) && rooms.contains(item.classroomId))
        .toList()
      ..sort((a, b) => b.savedAt.compareTo(a.savedAt));
    return items;
  }

  List<ModuleQuota> get myQuotas {
    return [
      for (final assignment in myAssignments)
        ModuleQuota(
          assignment: assignment,
          hoursDone: sessions
              .where(
                (item) =>
                    item.courseId == assignment.courseId &&
                    assignment.classroomIds.contains(item.classroomId),
              )
              .fold<double>(0, (sum, item) => sum + assignment.hoursPerSession),
        ),
    ];
  }

  ScheduleEntry? timetableEntryFor({
    required String classroomId,
    required String courseId,
    required String date,
  }) {
    final weekday = DateTime.parse(date).weekday;
    for (final entry in timetable) {
      if (entry.classroomId == classroomId && entry.courseId == courseId && entry.day == weekday) {
        return entry;
      }
    }
    return null;
  }

  int slotIndexFor({required String classroomId, required String courseId, required String date}) {
    return timetableEntryFor(classroomId: classroomId, courseId: courseId, date: date)?.slotIndex ?? 0;
  }

  DateTime slotStartOn(String date, int slotIndex) {
    final slot = defaultSlots[slotIndex.clamp(0, defaultSlots.length - 1)];
    final parts = slot.start.split(':');
    final day = DateTime.parse(date);
    return DateTime(day.year, day.month, day.day, int.parse(parts[0]), int.parse(parts[1]));
  }

  bool canEditAttendance(
    AttendanceSession? session, {
    String? classroomId,
    String? courseId,
    String? date,
  }) =>
      lockReason(session, classroomId: classroomId, courseId: courseId, date: date) == null;

  String? lockReason(
    AttendanceSession? session, {
    String? classroomId,
    String? courseId,
    String? date,
  }) {
    if (session?.reviewedBySg == true) {
      return 'Le surveillant général a déjà consulté cet appel. Il ne peut plus être modifié.';
    }
    final cid = session?.classroomId ?? classroomId;
    final crid = session?.courseId ?? courseId;
    final day = session?.date ?? date;
    if (cid == null || crid == null || day == null) return null;

    final entry = timetableEntryFor(classroomId: cid, courseId: crid, date: day);
    if (entry == null) {
      return 'Aucun cours de ce module n’est programmé à cette date.';
    }
    final slotIndex = session?.slotIndex ?? entry.slotIndex;
    final start = slotStartOn(day, slotIndex);
    if (DateTime.now().isBefore(start)) {
      final slot = defaultSlots[slotIndex.clamp(0, defaultSlots.length - 1)];
      return 'L’appel n’est possible qu’à partir de ${slot.start}, heure de début du cours.';
    }
    return null;
  }

  List<SlotOccurrence> occurrencesFor(TeachingAssignment assignment, {int weeksBack = 6}) {
    final teacherId = currentTeacher?.id ?? assignment.teacherId;
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    final start = today.subtract(Duration(days: weeksBack * 7));
    final items = <SlotOccurrence>[];
    for (var cursor = start; !cursor.isAfter(today); cursor = cursor.add(const Duration(days: 1))) {
      if (cursor.weekday > 5) continue;
      final date = cursor.toIso8601String().substring(0, 10);
      for (final entry in timetable) {
        if (entry.teacherId != teacherId) continue;
        if (entry.courseId != assignment.courseId) continue;
        if (!assignment.classroomIds.contains(entry.classroomId)) continue;
        if (entry.day != cursor.weekday) continue;
        items.add(
          SlotOccurrence(
            date: date,
            entry: entry,
            session: findSession(
              classroomId: entry.classroomId,
              courseId: entry.courseId,
              date: date,
            ),
          ),
        );
      }
    }
    return items.reversed.toList();
  }

  bool teacherMissed(SlotOccurrence item) {
    if (item.taught) return false;
    return !DateTime.now().isBefore(slotStartOn(item.date, item.entry.slotIndex));
  }

  TeacherAccount? _teacherByEmail(String email) {
    final needle = email.trim().toLowerCase();
    for (final item in teachers) {
      if (item.email.toLowerCase() == needle) return item;
    }
    return null;
  }

  Future<String?> login(String email, String password) async {
    final teacher = _teacherByEmail(email);
    if (teacher == null || teacher.password != password) {
      return 'E-mail ou mot de passe incorrect.';
    }
    currentTeacher = teacher;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, teacher.email);
    notifyListeners();
    return null;
  }

  Future<void> logout() async {
    currentTeacher = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
    notifyListeners();
  }

  Future<void> saveAttendance(AttendanceSession session) async {
    final existing = findSession(
      classroomId: session.classroomId,
      courseId: session.courseId,
      date: session.date,
    );
    final reason = lockReason(
      existing ?? session,
      classroomId: session.classroomId,
      courseId: session.courseId,
      date: session.date,
    );
    if (reason != null) throw reason;
    if (existing != null) {
      existing.marks
        ..clear()
        ..addAll(session.marks);
      existing.notes = session.notes;
      existing.savedAt = session.savedAt;
      existing.slotIndex = session.slotIndex;
    } else {
      sessions.insert(0, session);
    }
    await _persistAttendance();
    notifyListeners();
  }

  Future<void> setPhotoPath(String teacherId, String path) async {
    photoPaths[teacherId] = path;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_photoKey, jsonEncode(photoPaths));
    notifyListeners();
  }

  Future<void> _persistAttendance() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_attendanceKey, jsonEncode(sessions.map(_encodeSession).toList()));
  }

  Map<String, dynamic> _encodeSession(AttendanceSession item) => {
        'id': item.id,
        'classroomId': item.classroomId,
        'courseId': item.courseId,
        'date': item.date,
        'notes': item.notes,
        'savedAt': item.savedAt.toIso8601String(),
        'slotIndex': item.slotIndex,
        'reviewedBySg': item.reviewedBySg,
        'marks': item.marks.map((key, value) => MapEntry(key, value.name)),
      };

  void _restoreAttendance(String? raw) {
    if (raw == null || raw.isEmpty) return;
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      sessions
        ..clear()
        ..addAll(list.map((item) => _decodeSession(item as Map<String, dynamic>)));
    } catch (_) {}
  }

  AttendanceSession _decodeSession(Map<String, dynamic> map) {
    final marksRaw = Map<String, dynamic>.from(map['marks'] as Map);
    return AttendanceSession(
      id: map['id'] as String,
      classroomId: map['classroomId'] as String,
      courseId: map['courseId'] as String,
      date: map['date'] as String,
      notes: map['notes'] as String? ?? '',
      savedAt: DateTime.tryParse(map['savedAt'] as String? ?? '') ?? DateTime.now(),
      slotIndex: map['slotIndex'] as int? ?? 0,
      reviewedBySg: map['reviewedBySg'] as bool? ?? false,
      marks: marksRaw.map((key, value) => MapEntry(key, _parseMark(value))),
    );
  }

  AttendanceMark _parseMark(dynamic value) {
    final name = '$value';
    if (name == 'absent' || name == 'excused' || name == 'excuse') return AttendanceMark.absent;
    return AttendanceMark.present;
  }

  Map<String, AttendanceMark> _demoMarks(Iterable<String> ids, {int absentEvery = 5}) {
    var i = 0;
    return {
      for (final id in ids) id: (++i % absentEvery == 0) ? AttendanceMark.absent : AttendanceMark.present,
    };
  }

  void _seedHistory() {
    final douanes = classrooms.firstWhere((item) => item.id == 'cls-douanes');
    final impots = classrooms.firstWhere((item) => item.id == 'cls-impots');
    final now = DateTime.now();
    String day(int ago) =>
        DateTime(now.year, now.month, now.day).subtract(Duration(days: ago)).toIso8601String().substring(0, 10);

    sessions.addAll([
      AttendanceSession(
        id: 'demo-sg',
        classroomId: douanes.id,
        courseId: 'crs-org',
        date: day(2),
        marks: _demoMarks(douanes.studentIds),
        notes: 'Appel consulté par le SG.',
        savedAt: now.subtract(const Duration(days: 2, hours: 4)),
        slotIndex: 0,
        reviewedBySg: true,
      ),
      AttendanceSession(
        id: 'demo-ended',
        classroomId: impots.id,
        courseId: 'crs-fin',
        date: day(1),
        marks: _demoMarks(impots.studentIds, absentEvery: 4),
        notes: '',
        savedAt: now.subtract(const Duration(days: 1, hours: 6)),
        slotIndex: 0,
        reviewedBySg: false,
      ),
      AttendanceSession(
        id: 'demo-org-1',
        classroomId: douanes.id,
        courseId: 'crs-org',
        date: day(5),
        marks: _demoMarks(douanes.studentIds, absentEvery: 6),
        savedAt: now.subtract(const Duration(days: 5)),
        slotIndex: 0,
        reviewedBySg: true,
      ),
      AttendanceSession(
        id: 'demo-droit',
        classroomId: 'cls-admin',
        courseId: 'crs-droit',
        date: day(3),
        marks: _demoMarks(classrooms.firstWhere((item) => item.id == 'cls-admin').studentIds, absentEvery: 3),
        savedAt: now.subtract(const Duration(days: 3, hours: 5)),
        slotIndex: 1,
        reviewedBySg: false,
      ),
    ]);
  }

  TeacherAccount? teacherOf(String id) {
    try {
      return teachers.firstWhere((item) => item.id == id);
    } catch (_) {
      return null;
    }
  }
}
