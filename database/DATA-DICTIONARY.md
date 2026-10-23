# Portal data dictionary

All `data` columns are MySQL JSON objects. Times stored by the API are Unix milliseconds unless named date/dueDate (YYYY-MM-DD). IDs are application-generated strings. Arrays below retain the existing frontend format.

| Table | Contents |
| --- | --- |
| users | Dedicated id, username, email, school_id, role (student/teacher), created_at. JSON: hash, salt, fullName, contact, age, address, course, yearLevel, section, semester, createdAt; optional faculty department. Dedicated identity/role columns are authoritative. No plaintext passwords. |
| sessions | Hashed token, user_id foreign key, expiry milliseconds. Expired sessions are rejected. |
| academic_records | ID = student user ID. JSON: courses, gpa, assignments count, records, term. Historical records keep the existing arrays [grade,code,title,units,lectureUnits,labUnits]. Managed class grades are merged by the API. |
| notification_preferences | ID = user ID. JSON boolean announcements, assignments. |
| enrollment_applications | ID = student user ID. JSON: fullName, birthDate, gender, age, address, contact, email, guardian, relationship, guardianContact, lastSchool, yearLevel, course, studentType, status, submittedAt. Stores latest application; document submission remains through school office. |
| support_reports | JSON: uid, message, createdAt. |
| portal_content | ID announcements contains JSON items array: title, category, date, body. Reserved for institution-wide content supplied by administrator. |
| classes | JSON: teacherId, studentIds array, name, code, section, term, days, time, room, units. One assigned teacher per class; studentIds is enrollment roster. Maintain valid user IDs through trusted administration. |
| class_grades | ID classId_studentId. JSON: classId, studentId, teacherId, grade, feedback, updatedAt. Current class grade; not a grade-change history. |
| class_attendance | ID classId_studentId_date. JSON: classId, studentId, teacherId, date, status (Present/Absent/Late/Excused), updatedAt. One record per student/class/day. |
| class_assignments | UUID ID. JSON: classId, teacherId, title, instructions, dueDate, updatedAt. |
| class_submissions | ID assignmentId_studentId. JSON: classId, assignmentId, studentId, answer, submittedAt. Latest text response; no file upload. |
| class_announcements | UUID ID. JSON: classId, teacherId, title, body, category, date, updatedAt. |

Class-related tables expose generated class_id columns with indexes and foreign keys. Membership and teacher role checks happen on the server on every request, rather than relying on hidden menu links. JSON roster references and assignment/student references must be kept consistent by the administrator; this compatibility schema does not add foreign keys inside JSON arrays.

MySQL JSON reference: https://dev.mysql.com/doc/refman/8.4/en/json.html
