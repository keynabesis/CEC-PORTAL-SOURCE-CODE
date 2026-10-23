# MySQL student and teacher portal

The existing student HTML, CSS and JavaScript files are unchanged. The Node.js database adapter now uses MySQL instead of Firebase. A teacher who logs in using the existing login form is redirected by the server to teacher.html. Firebase deployment files are archived in legacy-firebase and are not used. Older SETUP.md/README.md Firebase directions are superseded by this document.

## Preview before installing MySQL

Open a terminal in this folder (the one containing package.json):

```powershell
npm.cmd run demo
```

Open http://localhost:3000/login.html. Demo accounts all use password `Preview123!`:

- teacher.demo: three assigned classes and two sample students.
- teacher.two: a different assigned class, useful for checking access restrictions.
- student.demo and student.two: student accounts.

Demo records are held in memory and reset on restart. Demo accounts are never created in the MySQL database automatically.

## Install and connect MySQL later

1. Install MySQL Server 8.4 and MySQL Workbench. Import database/schema.sql in Workbench. This creates cec_portal and its tables; it does not delete an existing database.
2. Create the dedicated database user using the commented SQL at the bottom of schema.sql, replacing the example password.
3. Copy .env.example to .env. Fill in MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER and MYSQL_PASSWORD. Keep .env outside public/ and out of version control.
4. Run `npm.cmd install`, then `npm.cmd start` from this folder. Use the Node.js address, not Live Server, for login and database features.
5. Register real users on the existing signup page. Every public signup becomes a student, even if a request includes a teacher role.
6. A trusted database administrator may promote a verified faculty account:

```sql
USE cec_portal;
UPDATE users SET role='teacher' WHERE username='verified.teacher.username';
```

Roles are read from the users.role column on each request. Do not edit the JSON role field to grant access. Students and teachers cannot change their own role through profile settings. There is no public administrator account or admin dashboard.

## Assign a class

Select the actual IDs from users, then use the following template in Workbench. Replace the usernames, class ID and course information before execution. Check that the teacher has role teacher and each student has role student. Class administration is a trusted database operation; it is not exposed to teachers or public signup.

```sql
SET @teacher = (SELECT id FROM users WHERE username='verified.teacher.username' AND role='teacher');
SET @student = (SELECT id FROM users WHERE username='registered.student.username' AND role='student');
-- Verify both values are non-NULL before inserting:
SELECT @teacher, @student;
INSERT INTO classes (id,data)
SELECT 'it-spi31-section3', JSON_OBJECT(
 'teacherId',@teacher,'studentIds',JSON_ARRAY(@student),
 'name','Social and Professional Issues','code','IT SPI31',
 'section','Section 3','term','1st Semester · S.Y. 2026–2027',
 'days','Tuesday & Thursday','time','9:00 AM – 10:30 AM',
 'room','C1-4','units',3)
WHERE @teacher IS NOT NULL AND @student IS NOT NULL;
```

Teachers can publish class grades, attendance, assignments and announcements only for their assigned classes. Student APIs return only enrolled classes and that student's submissions/attendance. Existing student grade, schedule and announcement pages consume the updated backend. The existing assignment/attendance placeholder pages are intentionally unchanged; their new APIs are available, but the old UI does not yet show or submit these records.

## Multiple devices

Run ONE Node.js server connected to ONE MySQL database. Both devices open that server's URL. For a trusted local network, set HOST=0.0.0.0 and APP_ORIGIN=http://YOUR-SERVER-LAN-IP:3000, restart, and open that same URL on both devices. Allow the Node.js port through the host firewall. Browsers do not connect directly to MySQL. Internet deployment requires a hosted Node.js server, HTTPS and the corresponding APP_ORIGIN; set NODE_ENV=production for secure session cookies. Do not expose the MySQL port publicly just to let students use the website.

## Database coverage

See database/DATA-DICTIONARY.md. The SQL tables preserve the existing API record shapes in MySQL JSON columns to avoid rewriting student pages. This is a compatibility schema, not a fully normalized registrar system. Identity/role/session fields have dedicated columns, unique keys and foreign keys; class records have indexed class foreign keys. SQL queries use bound parameters. Passwords retain the existing scrypt hashing and random salts; session tokens are stored as hashes.

No Firebase data has been migrated. If real Firebase records exist, a separate export/import migration is needed. Files, document uploads, social login, password reset emails and official GPA recalculation are not implemented by this addition. No MySQL server was available during development: run the integration test after installation before using real student data.

```powershell
npm.cmd test
node --env-file=.env --test test/mysql.integration.cjs
```

The integration test inserts temporary test records, validates SQL persistence, then deletes only those records. Run it against a test database initialized using schema.sql, not production.
