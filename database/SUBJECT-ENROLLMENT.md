# Subject enrollment setup

Students open **Enroll in Subjects** from the dashboard or sidebar, choose a section/schedule and click Enroll. Enrollment is immediate; no approval workflow is enabled. Existing enrollment-application forms remain separate.

For an existing MySQL installation, run `database/subject-enrollment.sql` once in Workbench. New installations use the updated schema.sql. Restart Node.js after updating the code. No existing class records are deleted or opened automatically.

Each class is one schedule offering. Create multiple class records with the same `code` and `term` and different IDs/sections to offer schedule choices. Keep `code` and `term` consistent across all offerings of the same subject. Alongside the existing teacherId, studentIds, name, code, units, section, room, term, days and time fields, set:

```json
{
  "capacity": 30,
  "enrollmentOpen": true,
  "meetings": [
    {"day": 1, "start": 540, "end": 630},
    {"day": 3, "start": 540, "end": 630}
  ]
}
```

Days are 1=Monday through 7=Sunday. Start/end are minutes after midnight (540=09:00; 630=10:30). These structured meetings enforce conflicts; `days` and `time` are display labels and must describe the same times. All enrolled classes in a term need valid structured meetings before students can add more subjects. Term identifiers distinguish separate academic terms. This supports recurring weekly schedules, not alternating weeks or date-specific exceptions.

Example update for an existing, verified class ID:

```sql
UPDATE classes SET data=JSON_SET(data,
 '$.capacity',30,'$.enrollmentOpen',CAST('true' AS JSON),
 '$.meetings',JSON_ARRAY(JSON_OBJECT('day',1,'start',540,'end',630)))
WHERE id='YOUR-CLASS-ID';
```

Use trusted administration to configure real offerings and faculty assignments. Students cannot edit schedules, capacity or rosters. MySQL enrollments use a transaction and shared lock to serialize seat allocation and duplicate/conflict checks across devices and Node.js instances. Administrator roster edits must not bypass these checks during enrollment. Prerequisites, fee clearance, program restrictions, dropping, and schedule changes after enrollment are not included.

Demo: log in as student.two and choose either Networking schedule, or create a new student account to try other subjects. Demo resets on server restart; real MySQL records persist and appear in the assigned teacher's roster.
