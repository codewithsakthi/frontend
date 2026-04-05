const gradeFromTotal = (total) => {
  if (total === null || total === undefined || Number.isNaN(Number(total))) return null;
  const value = Number(total);
  if (value >= 90) return 'O';
  if (value >= 80) return 'A+';
  if (value >= 70) return 'A';
  if (value >= 60) return 'B+';
  if (value >= 50) return 'B';
  if (value >= 45) return 'C';
  return 'F';
};

const computeInternal = (cit1, cit2, cit3) => {
  const values = [cit1, cit2, cit3].map((v) => (v === null || v === undefined ? null : Number(v))).filter((v) => Number.isFinite(v));
  return values.length ? Math.max(...values) : null;
};

const computeTotal = (internal, exam) => {
  if (internal === null && exam === null) return null;
  return Number((internal || 0) + (exam || 0));
};

const computeResultStatus = (total) => {
  if (total === null || total === undefined) return null;
  return Number(total) >= 50 ? 'PASS' : 'FAIL';
};

const pivotAssessmentsToMarks = (assessments = []) => {
  const map = new Map();

  assessments.forEach((row) => {
    const subject = row?.subject;
    const subjectId = row?.subject_id ?? subject?.id;
    const semester = Number(row?.semester || 0);
    if (!subjectId || !semester) return;

    const key = `${subjectId}:${semester}`;
    if (!map.has(key)) {
      map.set(key, {
        semester,
        subject: subject ? { ...subject, id: subjectId } : { id: subjectId },
        cit1: null,
        cit2: null,
        cit3: null,
        sem_exam: null,
        lab: null,
        project: null,
        attempt: null,
        remarks: null,
      });
    }

    const bucket = map.get(key);
    const type = String(row?.assessment_type || '').toUpperCase();
    const marks = row?.marks === null || row?.marks === undefined ? null : Number(row.marks);

    if (type === 'CIT1') bucket.cit1 = marks;
    if (type === 'CIT2') bucket.cit2 = marks;
    if (type === 'CIT3') bucket.cit3 = marks;
    if (type === 'SEMESTER_EXAM') {
      bucket.sem_exam = marks;
      bucket.attempt = row?.attempt ?? bucket.attempt;
      bucket.remarks = row?.remarks ?? bucket.remarks;
    }
    if (type === 'LAB') bucket.lab = marks;
    if (type === 'PROJECT') bucket.project = marks;
  });

  return Array.from(map.values()).map((item) => {
    const code = String(item?.subject?.course_code || '').toUpperCase();
    const isAudit = code.startsWith('24AC');

    const examComponent = item.sem_exam ?? item.lab ?? item.project ?? null;
    const internal = computeInternal(item.cit1, item.cit2, item.cit3);

    // Remove automatic P grade assignment for audit courses
    // All courses (including audit) now only get grades when assessments are taken
    
    const total = computeTotal(internal, examComponent);
    const grade = gradeFromTotal(total);

    return {
      ...item,
      internal_marks: internal,
      total_marks: total,
      grade,
      result_status: computeResultStatus(total),
    };
  });
};

// 1) Student Profile (Admin student-record flattener)
export const mapFullStudentRecord = (raw) => ({
  roll_no: raw?.roll_no,
  core_profile: raw?.core_profile ?? null,
  contact_info: raw?.contact_info ?? null,
  family_details: raw?.family_details ?? null,
  previous_academics: raw?.previous_academics ?? [],
  extra_curricular: raw?.extra_curricular ?? [],
  counselor_diary: raw?.counselor_diary ?? [],
  semester_grades: raw?.semester_grades ?? [],
  internal_marks: raw?.internal_marks ?? [],
  record_health: raw?.record_health ?? null,
  academic_snapshot: raw?.academic_snapshot ?? null,
});

// 2) Student Marks / Report Card
export const mapStudentPerformance = (raw) => {
  const rawMarks = Array.isArray(raw?.marks) ? raw.marks : pivotAssessmentsToMarks(raw?.assessments || []);

  const marks = (Array.isArray(rawMarks) ? rawMarks : []).map((mark) => {
    const subject = mark?.subject ?? null;
    const subjectId = subject?.id ?? mark?.subject_id ?? null;
    const semester = Number(mark?.semester || 0);

    const cit1 = mark?.cit1 ?? mark?.cit1_marks ?? null;
    const cit2 = mark?.cit2 ?? mark?.cit2_marks ?? null;
    const cit3 = mark?.cit3 ?? mark?.cit3_marks ?? null;

    return {
      ...(mark || {}),
      id: mark?.id ?? (subjectId && semester ? `${subjectId}:${semester}` : undefined),
      cit1,
      cit2,
      cit3,
      cit1_marks: cit1,
      cit2_marks: cit2,
      cit3_marks: cit3,
    };
  });

  return { ...(raw || {}), marks };
};

// 3) Attendance Summary (keep shape; backend prefers v_attendance_summary)
export const mapAttendanceSummary = (raw) => raw;

// 4) Attendance by Date / Period
export const mapDailyAttendanceReport = (raw) => ({
  summary: raw?.summary ?? '',
  rows: raw?.rows ?? [],
});

// 5) Timetable
export const mapTimetableEntries = (raw) => (Array.isArray(raw) ? raw : []);

// 6) Faculty Dashboard
export const mapStaffDashboard = (raw) => ({
  staff_id: raw?.staff_id,
  name: raw?.name,
  department: raw?.department ?? null,
  subjects: raw?.subjects ?? [],
  total_students_handled: raw?.total_students_handled ?? 0,
  recent_marks_updates: raw?.recent_marks_updates ?? [],
  average_performance: raw?.average_performance ?? 0,
  pending_marks_count: raw?.pending_marks_count ?? 0,
});

// 10) Auth / Login payloads
export const mapCurrentUser = (raw) => raw;

export const mapAuthToken = (raw) => raw;
