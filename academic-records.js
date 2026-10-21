/*
  Academic Records page logic.

  DATA SOURCE
  -----------
  This page tries GET /api/academic-records?year=<n>&semester=<n>.
  When no record is available, it displays an empty academic record.

  To hook it up for real: on your Node/Express server, add a route like

    app.get('/api/academic-records', (req, res) => {
      const { year, semester } = req.query;
      // look up the logged-in student, return { student, subjects }
      res.json({ student, subjects });
    });

  and the fetch() call below will pick it up automatically — no other
  changes needed on this page.
*/

const MAX_YEAR = 4;
let currentYear = 1;
let currentSemester = 1;

const el = {
  studentSummary: document.getElementById('studentSummary'),
  idNumber: document.getElementById('idNumber'),
  studentName: document.getElementById('studentName'),
  courseYear: document.getElementById('courseYear'),
  section: document.getElementById('section'),
  academicYear: document.getElementById('academicYear'),
  semesterSelect: document.getElementById('semesterSelect'),
  gradesBody: document.getElementById('gradesBody'),
  totalUnits: document.getElementById('totalUnits'),
  totalLec: document.getElementById('totalLec'),
  totalLab: document.getElementById('totalLab'),
  yearLabel: document.getElementById('yearLabel'),
  prevYearBtn: document.getElementById('prevYearBtn'),
  nextYearBtn: document.getElementById('nextYearBtn')
};

function ordinal(n) {
  return ['', '1st', '2nd', '3rd', '4th'][n] || `${n}th`;
}

function initHeader() {
  el.studentSummary.textContent = 'No student record yet.';
}

function initSemesterOptions() {
  el.semesterSelect.innerHTML = '';
  [1, 2].forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = `${ordinal(s)} Semester`;
    el.semesterSelect.appendChild(opt);
  });
  el.semesterSelect.value = currentSemester;
  el.semesterSelect.addEventListener('change', () => {
    currentSemester = Number(el.semesterSelect.value);
    render();
  });
}

async function fetchRecord(year, semester) {
  try {
    const res = await fetch(`/api/academic-records?year=${year}&semester=${semester}`);
    if (res.ok) return await res.json();
  } catch (e) {
    // The empty-state display is used when the backend is unavailable.
  }
  return null;
}

function renderSubjects(subjects) {
  el.gradesBody.innerHTML = '';

  if (!subjects || subjects.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="7" style="color:#8a8a8a; padding:24px;">No records yet for this year/semester.</td>`;
    el.gradesBody.appendChild(row);
    el.totalUnits.textContent = '—';
    el.totalLec.textContent = '—';
    el.totalLab.textContent = '—';
    return;
  }

  let totalUnits = 0, totalLec = 0, totalLab = 0;

  subjects.forEach((s) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${s.grade}</td>
      <td>${s.code}</td>
      <td>${s.title}</td>
      <td>${s.units}</td>
      <td>${s.lec}</td>
      <td>${s.lab === '' || s.lab === undefined ? '' : s.lab}</td>
      <td>${s.prereq || ''}</td>
    `;
    el.gradesBody.appendChild(row);

    totalUnits += Number(s.units) || 0;
    totalLec += Number(s.lec) || 0;
    totalLab += Number(s.lab) || 0;
  });

  el.totalUnits.textContent = totalUnits;
  el.totalLec.textContent = totalLec;
  el.totalLab.textContent = totalLab || '';
}

async function render() {
  el.prevYearBtn.disabled = currentYear <= 1;
  el.nextYearBtn.disabled = currentYear >= MAX_YEAR;
  el.yearLabel.textContent = `${ordinal(currentYear)} Year`;

  const record = await fetchRecord(currentYear, currentSemester);

  el.courseYear.textContent = record?.courseYear || '—';
  el.academicYear.textContent = record?.academicYear || '—';

  renderSubjects(record?.subjects);
}

el.prevYearBtn.addEventListener('click', () => {
  if (currentYear > 1) { currentYear -= 1; render(); }
});
el.nextYearBtn.addEventListener('click', () => {
  if (currentYear < MAX_YEAR) { currentYear += 1; render(); }
});

initHeader();
initSemesterOptions();
render();