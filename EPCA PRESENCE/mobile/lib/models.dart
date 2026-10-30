enum AttendanceMark { present, absent }

extension AttendanceMarkX on AttendanceMark {
  String get label => switch (this) {
        AttendanceMark.present => 'Présent',
        AttendanceMark.absent => 'Absent',
      };

  String get short => switch (this) {
        AttendanceMark.present => 'P',
        AttendanceMark.absent => 'A',
      };
}

class CategoryInfo {
  const CategoryInfo({required this.id, required this.code, required this.name});
  final String id;
  final String code;
  final String name;
}

class TeacherAccount {
  const TeacherAccount({
    required this.id,
    required this.lastName,
    required this.firstNames,
    required this.email,
    required this.password,
    required this.phone,
    required this.specialty,
  });

  final String id;
  final String lastName;
  final String firstNames;
  final String email;
  final String password;
  final String phone;
  final String specialty;

  String get fullName => '$lastName $firstNames';
  String get initials =>
      '${lastName.isNotEmpty ? lastName[0] : '?'}${firstNames.isNotEmpty ? firstNames[0] : ''}'
          .toUpperCase();
}

class Student {
  const Student({
    required this.id,
    required this.lastName,
    required this.firstNames,
    required this.number,
  });

  final String id;
  final String lastName;
  final String firstNames;
  final String number;

  String get fullName => '$lastName $firstNames';
  String get initials =>
      '${lastName.isNotEmpty ? lastName[0] : '?'}${firstNames.isNotEmpty ? firstNames[0] : ''}'
          .toUpperCase();
}

class Classroom {
  const Classroom({
    required this.id,
    required this.name,
    required this.roomLabel,
    required this.categoryId,
    required this.filiere,
    required this.quota,
    required this.studentIds,
  });

  final String id;
  final String name;
  final String roomLabel;
  final String categoryId;
  final String filiere;
  final int quota;
  final List<String> studentIds;
}

class Course {
  const Course({required this.id, required this.code, required this.name});
  final String id;
  final String code;
  final String name;
}

class TeachingAssignment {
  const TeachingAssignment({
    required this.teacherId,
    required this.courseId,
    required this.classroomIds,
    required this.hourQuota,
    this.hoursPerSession = 2,
  });

  final String teacherId;
  final String courseId;
  final List<String> classroomIds;
  final int hourQuota;
  final double hoursPerSession;
}

class ScheduleSlot {
  const ScheduleSlot({required this.start, required this.end});
  final String start;
  final String end;
  String get label => '$start – $end';
}

class ScheduleEntry {
  const ScheduleEntry({
    required this.id,
    required this.classroomId,
    required this.day,
    required this.slotIndex,
    required this.courseId,
    required this.teacherId,
    required this.room,
  });

  final String id;
  final String classroomId;
  final int day;
  final int slotIndex;
  final String courseId;
  final String teacherId;
  final String room;
}

class AttendanceSession {
  AttendanceSession({
    required this.id,
    required this.classroomId,
    required this.courseId,
    required this.date,
    required this.marks,
    this.notes = '',
    required this.savedAt,
    this.slotIndex = 0,
    this.reviewedBySg = false,
  });

  final String id;
  final String classroomId;
  final String courseId;
  final String date;
  final Map<String, AttendanceMark> marks;
  String notes;
  DateTime savedAt;
  int slotIndex;
  bool reviewedBySg;
}

class ModuleQuota {
  const ModuleQuota({
    required this.assignment,
    required this.hoursDone,
  });

  final TeachingAssignment assignment;
  final double hoursDone;

  int get hourQuota => assignment.hourQuota;
  double get hoursLeft => (hourQuota - hoursDone).clamp(0, hourQuota.toDouble());
  int get sessionsDone => assignment.hoursPerSession == 0
      ? 0
      : (hoursDone / assignment.hoursPerSession).round();
  int get sessionsLeft => assignment.hoursPerSession == 0
      ? 0
      : (hoursLeft / assignment.hoursPerSession).ceil();
  double get progress => hourQuota == 0 ? 0 : (hoursDone / hourQuota).clamp(0, 1);
}

class SlotOccurrence {
  const SlotOccurrence({
    required this.date,
    required this.entry,
    this.session,
  });

  final String date;
  final ScheduleEntry entry;
  final AttendanceSession? session;

  bool get taught => session != null;
}
