/* ==========================================================================
   ANNOUNCEMENT — behaviour
   - Renders every announcement (tag, date, card, audience pill) at the exact
     coordinates used in the design
   - Click / Enter / Space on a card shows it in the detail card
   - Click a category tag to highlight that category (click again or Esc = clear)
   - "Apply now.." toggle on the Intramurals card
   - Scales the 1440px design to fit smaller screens
   Edit the ANNOUNCEMENTS array (or load it from your API) to change content.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- Data ---------------- */
  // Tag looks come from each tag's own fill/stroke/text colour in the design.
  var TAG = {
    deadlineA:   { cat: 'Deadline',    w: 68, tx: 9,  fill: '#ff0000', stroke: '#ff0000', color: '#cccccc', tStroke: '#000000' },
    deadline:    { cat: 'Deadline',    w: 68, tx: 10, fill: '#ff0000', stroke: '#ff0000', color: '#000000' },
    deadlineH:   { cat: 'Deadline',    w: 68, tx: 10, fill: '#ff0000', stroke: '#ff0000', color: '#0a0a09', tStroke: '#000000', font: '"Hanken Grotesk", sans-serif' },
    academics:   { cat: 'Academics',   w: 80, tx: 10, fill: '#236bbd', stroke: '#26177f', color: '#fffaf6' },
    maintenance: { cat: 'Maintenance', w: 92, tx: 10, fill: '#cc1b1b', stroke: '#ff0000', color: '#000000', tStroke: '#ff0000' },
    grade:       { cat: 'Grade',       w: 68, tx: 15, fill: '#34c759', stroke: '#17ac10', color: '#000000' },
    enrollment:  { cat: 'Enrollment',  w: 79, tx: 10, fill: '#ffcc00', stroke: '#ffcc00', color: '#000000' }
  };

  // body lines: strings, or {t:'text', b:true} for bold.  Line breaks match the design.
  var REC_BODY = [
    'College students planning to  request a teacher',
    'recommendation letter must submit the request form',
    'to the guidance office by 3:00 PM Friday. Late  requests',
    'will not be guaranteed before the winter application',
    'window.',
    { t: 'Guidance Office', b: true }
  ];

  var ANNOUNCEMENTS = [
    /* ---- Timeline inside the grey panel ---- */
    { id: 'rec', tag: 'deadlineA', tagAt: [346, 173], date: { at: [284, 277], text: '12\nSEP' },
      card: { at: [346, 210], fx: 'blur' }, audience: 'All Students', pill: [674, 333],
      title: { dx: 28, dy: 15, lines: ['College recommendation', 'request due Friday.'] },
      body: { dx: 28, dy: 73, size: 'sm', lines: REC_BODY } },

    { id: 'midterm-exam', tag: 'academics', tagAt: [346, 438], date: { at: [284, 537], text: '24\nSEP' },
      card: { at: [346, 472], fx: 'flat' }, audience: 'All Students', pill: [671, 594],
      title: { dx: 28, dy: 22, lines: ['Academic'] },
      body: { dx: 29, dy: 53, size: 'lg', lines: ['Midterm Examination', 'Schedule & Room', 'Assignments.'] } },

    { id: 'portal-maint', tag: 'maintenance', tagAt: [346, 702], date: { at: [283, 793], text: '5\nOCT' },
      card: { at: [346, 736], fx: 'blur-shadow' }, audience: 'All Students', pill: [674, 857],
      title: { dx: 28, dy: 12, lines: ['IT / Systems'] },
      body: { dx: 28, dy: 57, size: 'xl', lines: ['Scheduled Student Portal', 'Maintenance (Sept 15, 12', 'AM - 4 AM)'] } },

    /* ---- Right-hand column ---- */
    { id: 'midterm-grade', tag: 'grade', tagAt: [963, 26], card: { at: [963, 63], fx: 'shadow' },
      audience: 'All Students', pill: [1297, 185],
      title: { dx: 28, dy: 12, lines: ['Midterm grade posted'] },
      body: { dx: 28, dy: 70, size: 'md', lines: ['Your midterm grade for CS 321 -', 'Computer Networks is now available.'] } },

    { id: 'tuition', tag: 'deadline', tagAt: [963, 286], card: { at: [963, 323], fx: 'shadow' },
      audience: 'All Students', pill: [1293, 447],
      title: { dx: 28, dy: 12, lines: ['Tuition payment due'] },
      body: { dx: 28, dy: 70, size: 'md', lines: ['2nd installment for 1st Sem 2026-2027 is', 'due September 15.'] } },

    { id: 'enlistment', tag: 'enrollment', tagAt: [963, 536], card: { at: [963, 573], fx: 'shadow' },
      audience: 'All Students', pill: [1296, 696],
      title: { dx: 28, dy: 12, lines: ['Enlistment window opens'] },
      body: { dx: 28, dy: 70, size: 'md', lines: ['Regular enlistment for 2nd Sem', '2026-2027 opens October 1, 8:00 AM.'] } },

    { id: 'room-change', tag: 'deadline', tagAt: [963, 786], card: { at: [963, 823], fx: 'shadow' },
      audience: 'All Students', pill: [1294, 948],
      title: { dx: 28, dy: 12, lines: ['Room change: CS 314'] },
      body: { dx: 28, dy: 70, size: 'md', lines: ['Software Engineering I moves from', 'R-205 to R-210 starting next week.'] } },

    { id: 'library', tag: 'deadline', tagAt: [963, 1036], card: { at: [963, 1073], fx: 'shadow' },
      audience: 'All Students', pill: [1297, 1200],
      title: { dx: 28, dy: 12, lines: ['Library extended hours'] },
      body: { dx: 28, dy: 70, size: 'md', lines: ['The main library will be open until 9:00', 'PM during finals week.'] } },

    { id: 'quiz', tag: 'deadlineH', tagAt: [963, 1286], card: { at: [963, 1323], fx: 'shadow' },
      audience: 'All Students', pill: [1301, 1450],
      title: { dx: 28, dy: 12, lines: ['Quiz score released'] },
      body: { dx: 28, dy: 70, size: 'md', lines: ['Quiz 3 results for CS 311 - Database', 'Management Systems are posted.'] } }
  ];

  var DESIGN_W = 1440, DESIGN_H = 1526;

  /* ---------------- Helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function px(n) { return n + 'px'; }
  function place(node, x, y) { node.style.left = px(x); node.style.top = px(y); return node; }

  // Append body lines (with optional bold segments) to a node.
  function fillLines(node, lines) {
    node.textContent = '';
    lines.forEach(function (ln, i) {
      if (i) node.appendChild(document.createTextNode('\n'));
      if (typeof ln === 'string') node.appendChild(document.createTextNode(ln));
      else { var b = el('b', null, ln.t); node.appendChild(b); }
    });
  }

  var stage = $('stage'), viewport = $('viewport'), feed = $('feed');
  var detail = $('detail'), selectedId = null, activeCat = null;
  var byId = {};

  /* ---------------- Render ---------------- */
  ANNOUNCEMENTS.forEach(function (a) {
    byId[a.id] = a;
    var t = TAG[a.tag];
    a.cat = t.cat;
    a.nodes = [];

    // Category tag
    var tag = el('button', 'tag');
    tag.type = 'button';
    tag.setAttribute('aria-pressed', 'false');
    tag.dataset.cat = t.cat;
    tag.style.width = px(t.w);
    tag.style.background = t.fill;
    tag.style.borderColor = t.stroke;
    place(tag, a.tagAt[0], a.tagAt[1]);
    var tt = el('span', 'tag__text', t.cat);
    tt.style.left = px(t.tx - 1);
    tt.style.color = t.color;
    if (t.font) tt.style.fontFamily = t.font;
    if (t.tStroke) { tt.style.webkitTextStroke = '2px ' + t.tStroke; tt.style.paintOrder = 'stroke fill'; }
    tag.appendChild(tt);
    tag.addEventListener('click', function (e) { e.stopPropagation(); setFilter(activeCat === t.cat ? null : t.cat); });
    feed.appendChild(tag); a.nodes.push(tag);

    // Date (timeline items only)
    if (a.date) {
      var d = el('div', 'date', a.date.text);
      d.setAttribute('aria-hidden', 'true');
      place(d, a.date.at[0], a.date.at[1]);
      feed.appendChild(d); a.nodes.push(d);
    }

    // Card
    var card = el('article', 'card');
    card.tabIndex = 0;
    card.dataset.id = a.id;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', a.title.lines.join(' '));
    place(card, a.card.at[0], a.card.at[1]);
    var bg = el('div', 'card__bg card--' + a.card.fx);
    card.appendChild(bg);
    // .card--shadow etc. are styled on the card element, so mirror the class there
    card.classList.add('card--' + a.card.fx);

    var title = el('h2', 'card__title', a.title.lines.join('\n'));
    title.style.whiteSpace = 'pre';
    place(title, a.title.dx, a.title.dy);
    card.appendChild(title);

    var body = el('p', 'card__body card__body--' + a.body.size);
    fillLines(body, a.body.lines);
    place(body, a.body.dx, a.body.dy);
    card.appendChild(body);

    var pill = el('span', 'pill');
    pill.appendChild(el('span', 'pill__text', a.audience));
    place(pill, a.pill[0] - a.card.at[0], a.pill[1] - a.card.at[1]);
    card.appendChild(pill);

    card.addEventListener('click', function () { select(a.id, true); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(a.id, true); }
    });
    feed.appendChild(card); a.nodes.push(card); a.cardEl = card;
  });

  /* ---------------- Detail card ---------------- */
  function select(id, mark) {
    var a = byId[id]; if (!a) return;
    selectedId = id;
    $('detailTitle').textContent = a.title.lines.join('\n');
    $('detailTitle').style.whiteSpace = 'pre';
    fillLines($('detailBody'), a.body.lines);
    // The design's detail pill reads "Students" (the "All" is dropped there)
    $('detailAudience').textContent = a.audience.replace(/^All\s+/, '');
    ANNOUNCEMENTS.forEach(function (x) { x.cardEl.classList.toggle('is-selected', mark && x.id === id); });
    try { sessionStorage.setItem('cec.announcement.selected', id); } catch (e) {}
  }

  /* ---------------- Category filter ---------------- */
  function setFilter(cat) {
    activeCat = cat;
    ANNOUNCEMENTS.forEach(function (a) {
      var dim = !!cat && a.cat !== cat;
      a.nodes.forEach(function (n) { n.classList.toggle('is-dim', dim); });
    });
    Array.prototype.forEach.call(feed.querySelectorAll('.tag'), function (t) {
      var on = !!cat && t.dataset.cat === cat;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $('filterStatus').textContent = cat ? 'Showing ' + cat + ' announcements' : 'Showing all announcements';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && activeCat) setFilter(null); });
  stage.addEventListener('click', function (e) {
    if (activeCat && !e.target.closest('.card, .tag')) setFilter(null);
  });

  /* ---------------- Apply button ---------------- */
  var apply = $('applyBtn');
  var APPLIED_KEY = 'cec.announcement.intramurals';
  function setApplied(on) {
    apply.setAttribute('aria-pressed', on ? 'true' : 'false');
    apply.textContent = on ? 'Applied' : 'Apply now..';
    try { sessionStorage.setItem(APPLIED_KEY, on ? '1' : '0'); } catch (e) {}
  }
  apply.addEventListener('click', function () { setApplied(apply.getAttribute('aria-pressed') !== 'true'); });

  /* ---------------- Sidebar links not designed yet ---------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-soon]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------------- Fit design to the window ---------------- */
  function fit() {
    var scale = Math.min(1, window.innerWidth / DESIGN_W);
    stage.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    viewport.style.height = px(DESIGN_H * scale);
  }
  window.addEventListener('resize', fit);

  /* ---------------- Init ---------------- */
  fillLines($('detailBody'), REC_BODY);       // default detail = first announcement (as designed)
  var applied = false;
  try { applied = sessionStorage.getItem(APPLIED_KEY) === '1'; } catch (e) {}
  if (applied) setApplied(true);
  fit();
})();
