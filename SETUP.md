# Connect your Firebase database

You can review every screen first using `npm run demo`. No cloud account is needed for that preview.

## 1. Create a project and database

1. Open https://console.firebase.google.com and create your Firebase project.
2. Open **Build → Firestore Database**, create the database, select a region, and choose production mode.
3. Use the `(default)` database. Record the project ID from Project settings.
4. In the Firestore Rules editor, paste the contents of `firestore.rules` and publish. Direct browser reads and writes are denied; the Node.js server authenticates users and performs database operations with the Admin SDK.

## 2. Configure the Node.js server

1. Install Node.js 22 or newer.
2. In Firebase Project settings → Service accounts, obtain a service-account key for your server. Store the downloaded JSON outside this project's `public` directory. Do not paste the key into chat or put it in frontend code.
3. Copy `.env.example` to `.env` and set:

```dotenv
DATABASE_MODE=firebase
FIREBASE_PROJECT_ID=your-actual-project-id
GOOGLE_APPLICATION_CREDENTIALS=C:/private/location/service-account.json
APP_ORIGIN=http://localhost:3000
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
```

4. Open a terminal in the project directory and run:

```sh
npm install
npm start
```

5. Open http://localhost:3000, create an account and log in. The demo credentials do not exist in Firebase mode.

Firebase credentials remain on the server. No Firebase web configuration or API key is required in the browser, because the frontend talks to your Node.js API.

## 3. Data collections

| Collection | Document ID | Contents |
|---|---|---|
| users | generated user ID | Profile fields plus server-only salted password hash |
| uniqueAccounts | field + SHA-256 value | Transactional username/email/school-ID uniqueness |
| sessions | SHA-256 session token | User ID and expiry timestamp in milliseconds |
| academics | user ID | courses, records, recordsByTerm, gpa, assignments, term |
| enrollments | user ID | Enrollment information and submission status |
| preferences | user ID | announcements and assignments booleans |
| portal | announcements | An `items` array of announcement objects |
| reports | generated ID | User ID, message and creation timestamp |

Only server-side trusted code should write academic information. Student profile edits cannot change courses, grades, year level or enrollment approval. Registration stores a student-provided school ID but does not verify institutional membership; add a school-controlled verification process before using this for official records.

An `academics/{userId}` document can contain:

```json
{
  "gpa": "1.74",
  "assignments": 3,
  "term": "1st Semester · S.Y. 2026–2027",
  "courses": [{
    "code": "IT SPI31",
    "name": "Social and Professional Issues",
    "teacher": "Instructor name",
    "days": "Tuesday & Thursday",
    "time": "9:00 AM – 10:30 AM",
    "room": "C1-4",
    "units": 3,
    "grade": "Pending"
  }],
  "records": [{"grade":"2.0","code":"GE 1","title":"PURPOSIVE COMMUNICATION","units":3,"lec":3,"lab":0,"prerequisites":""}],
  "recordsByTerm": {
    "2-1": [{"grade":"1.8","code":"IT 21","title":"EXAMPLE SUBJECT","units":3,"lec":2,"lab":1,"prerequisites":""}]
  }
}
```

Use arrays of objects for records as shown above; Firestore does not support directly nested arrays. The UI also accepts the compact row arrays used by the local demo.

An announcement has `title`, `category`, `date`, and `body`. Supported category colors are Important, Academic, Event, and General.

## 4. Verify your live connection

Create a disposable account, edit its profile, log out and back in, and restart the server to confirm persistence. Check that a second account cannot read the first account's enrollment or preferences. Verify that the Firebase console contains the expected records. No live Firebase testing has been done in the supplied project because there is no project or credential yet.

For deployment, serve over HTTPS, set `NODE_ENV=production`, change APP_ORIGIN to the exact public origin, and configure HOST as your host requires. Expired sessions are rejected by the API; schedule cleanup of expired Firestore session documents for storage housekeeping. A production system also needs institution-specific account verification and operational password recovery.

Official references: https://firebase.google.com/docs/admin/setup and https://firebase.google.com/docs/firestore/quickstart
