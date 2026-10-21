/* ==========================================================================
   GRADES — behaviour
   - Term picker (custom listbox, keyboard accessible)
   - Renders the course rows for the chosen term
   - Computes units, weighted average and standing
   - Scales the 1440px design to fit smaller screens
   Replace the TERMS data (or fetch it from your API) to show real grades.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- Data ---------------- */
  // grade: a number (e.g. 1.75) once released, or null while "Pending".
  var TERMS = [
    {
      id: '2026-1',
      label: '1st Sem, A.Y. 2026-2027',
      courses: [
        { code: 'IT IAS31',    title: 'Introduction to Information Assurance', instructor: 'Mr. Jay Base',         units: 3, grade: null },
        { code: 'GE ELEC 6',   title: 'Philippine Pop Culture',                instructor: 'Mrs. Melinda Amante',  units: 4, grade: null },
        { code: 'IT NET31 LAB',title: 'Computer Networking',                   instructor: 'Mr. Arnel Villanueva', units: 3, grade: null },
        { code: 'IT EVD31',    title: 'Database Management Systems',           instructor: 'Mr. Arnel Villanueva', units: 3, grade: null },
        { code: 'IT SIA31',    title: 'Systems Integration & Architecture',    instructor: 'Mr. Charles Bacatot',  units: 4, grade: null },
        { code: 'GE ELEC 5',   title: 'Panitikan',                             instructor: 'Mrs. Gracelda Tormis', units: 2, grade: null },
        { code: 'IT ELEC 1',   title: 'Elective (LAB)',                        instructor: 'Mrs. En Catarungan',   units: 3, grade: null }
      ]
    },
    // Earlier terms: add courses here once records are available.
    { id: '2025-2', label: '2nd Sem, A.Y. 2025-2026', courses: [] },
    { id: '2025-1', label: '1st Sem, A.Y. 2025-2026', courses: [] }
  ];

  /* Exact row geometry measured from the design (rows are hand-placed there).
     course/instructor/units/grade are the "top" values of each text layer.   */
  var ROW_LAYOUT = [
    { stripe: 333, course: 362, instructor: 383, units: 383, grade: 383, gradeX: 1349 },
    { stripe: 433, course: 464, instructor: 478, units: 478, grade: 478, gradeX: 1352 },
    { stripe: 533, course: 564, instructor: 578, units: 578, grade: 578, gradeX: 1349 },
    { stripe: 633, course: 666, instructor: 683, units: 680, grade: 680, gradeX: 1349 },
    { stripe: 740, course: 765, instructor: 778, units: 778, grade: 778, gradeX: 1349 },
    { stripe: 840, course: 867, instructor: 878, units: 881, grade: 881, gradeX: 1349 },
    { stripe: 940, course: 956, instructor: 983, units: 983, grade: 983, gradeX: 1349 }
  ];
  var ROW_PITCH = 100;

  var DESIGN_W = 1440, DESIGN_H = 1024;

  /* ---------------- Helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function px(n) { return n + 'px'; }

  function layoutFor(i) {
    if (ROW_LAYOUT[i]) return ROW_LAYOUT[i];
    var last = ROW_LAYOUT[ROW_LAYOUT.length - 1];
    var s = last.stripe + (i - ROW_LAYOUT.length + 1) * ROW_PITCH;
    return { stripe: s, course: s + 29, instructor: s + 50, units: s + 50, grade: s + 50, gradeX: 1349 };
  }

  var stage = $('stage'), viewport = $('viewport'), rowsEl = $('rows');
  var currentTerm = TERMS[0];

  /* ---------------- Rendering ---------------- */
  function renderRows(term) {
    rowsEl.textContent = '';
    var bottom = DESIGN_H;

    term.courses.forEach(function (c, i) {
      var L = layoutFor(i), alt = i % 2 === 1;
      var row = el('div', 'row');
      row.setAttribute('role', 'row');
      row.style.cssText = 'position:absolute;left:0;top:0;width:1440px;height:0';

      var bg = el('div', 'row__bg' + (alt ? ' row__bg--alt' : ''));
      bg.style.top = px(L.stripe);
      bg.setAttribute('aria-hidden', 'true');
      row.appendChild(bg);

      var course = el('div', 'cell cell--course', c.code + '\n' + c.title);
      course.style.top = px(L.course);
      course.setAttribute('role', 'cell');

      var ins = el('div', 'cell cell--instructor', c.instructor);
      ins.style.top = px(L.instructor);
      ins.setAttribute('role', 'cell');

      var units = el('div', 'cell cell--units', String(c.units));
      units.style.top = px(L.units);
      units.setAttribute('role', 'cell');

      var released = typeof c.grade === 'number';
      var grade = el('div', 'cell cell--grade' + (released ? '' : ' cell--pending'),
                     released ? c.grade.toFixed(2) : 'Pending');
      grade.style.top = px(L.grade);
      grade.style.left = px(L.gradeX);
      grade.setAttribute('role', 'cell');

      row.appendChild(course); row.appendChild(ins); row.appendChild(units); row.appendChild(grade);
      rowsEl.appendChild(row);
      bottom = Math.max(bottom, L.stripe + ROW_PITCH);
    });

    if (!term.courses.length) {
      rowsEl.appendChild(el('p', 'empty', 'No grades have been released for this term yet.'));
    }
    setStageHeight(bottom);
  }

  function renderSummary(term) {
    var totalUnits = 0, gradedUnits = 0, points = 0, pending = 0;
    term.courses.forEach(function (c) {
      totalUnits += c.units;
      if (typeof c.grade === 'number') { gradedUnits += c.units; points += c.grade * c.units; }
      else pending++;
    });
    // Weighted average is only shown once every course has a released grade
    // (the design leaves the value blank while grades are pending).
    $('statAverage').textContent = (term.courses.length && !pending) ? (points / gradedUnits).toFixed(2) : '';
    $('statStanding').textContent = !term.courses.length ? '—' : (pending ? 'In progress' : 'Completed');
    $('statUnits').textContent = String(totalUnits);
  }

  function setStageHeight(h) {
    stage.style.height = px(h);
    stage.style.setProperty('--sidebar-h', px(h + 4));
    fit();
  }

  function selectTerm(term) {
    currentTerm = term;
    $('termLabel').textContent = term.label + ' ';
    renderSummary(term);
    renderRows(term);
    Array.prototype.forEach.call($('termMenu').children, function (li) {
      li.setAttribute('aria-selected', li.dataset.id === term.id ? 'true' : 'false');
    });
    try { sessionStorage.setItem('cec.grades.term', term.id); } catch (e) {}
  }

  /* ---------------- Term picker ---------------- */
  var btn = $('termButton'), menu = $('termMenu');

  TERMS.forEach(function (t) {
    var li = el('li', 'term__option', t.label);
    li.setAttribute('role', 'option');
    li.tabIndex = -1;
    li.dataset.id = t.id;
    li.addEventListener('click', function () { selectTerm(t); closeMenu(); btn.focus(); });
    li.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(menu.children), i = items.indexOf(li);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
      else if (e.key === 'Escape') { closeMenu(); btn.focus(); }
    });
    menu.appendChild(li);
  });

  function openMenu() {
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    var sel = menu.querySelector('[aria-selected="true"]') || menu.firstChild;
    if (sel) sel.focus();
  }
  function closeMenu() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', function () { menu.hidden ? openMenu() : closeMenu(); });
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' && menu.hidden) { e.preventDefault(); openMenu(); }
  });
  document.addEventListener('click', function (e) { if (!$('termPicker').contains(e.target)) closeMenu(); });

  /* ---------------- Sidebar links not designed yet ---------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-soon]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------------- Fit design to the window ---------------- */
  function fit() {
    var scale = Math.min(1, window.innerWidth / DESIGN_W);
    var h = parseFloat(stage.style.height) || DESIGN_H;
    stage.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    viewport.style.height = px(h * scale);
  }
  window.addEventListener('resize', fit);

  /* ---------------- Init ---------------- */
  var saved = null;
  try { saved = sessionStorage.getItem('cec.grades.term'); } catch (e) {}
  selectTerm(TERMS.filter(function (t) { return t.id === saved; })[0] || TERMS[0]);
})();
