document.addEventListener('DOMContentLoaded', () => {

    /* ---------------------------------------
       1. ACTIVE NAV LINK ON CLICK
    --------------------------------------- */
    const navLinks = document.querySelectorAll('.nav-list a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // remove this once links point to real pages
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    /* ---------------------------------------
       2. HIGHLIGHT TODAY'S COLUMN + CURRENT PERIOD
    --------------------------------------- */
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[new Date().getDay()];

    const headerSpans = document.querySelectorAll('.days-header span');
    const dayColumns = document.querySelectorAll('.day-columns .day');

    headerSpans.forEach((span, i) => {
        if (span.textContent.trim().toUpperCase() === todayName) {
            span.classList.add('today-header');
            if (dayColumns[i]) {
                dayColumns[i].classList.add('today-column');
                highlightCurrentPeriod(dayColumns[i]);
            }
        }
    });

    // Parses strings like "07:30-09:00AM" or "04:30-06:00PM" into minute ranges
    function parseTimeRange(text) {
        const match = text.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(AM|PM)$/i);
        if (!match) return null;

        const [, sh, sm, eh, em, period] = match;
        const toMinutes = (h, m) => {
            let hour = parseInt(h, 10) % 12;
            if (period.toUpperCase() === 'PM') hour += 12;
            return hour * 60 + parseInt(m, 10);
        };

        return { start: toMinutes(sh, sm), end: toMinutes(eh, em) };
    }

    function highlightCurrentPeriod(dayEl) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        dayEl.querySelectorAll('span').forEach(span => {
            const text = span.textContent.trim();
            if (text === 'VACANT') return;

            const range = parseTimeRange(text);
            if (range && nowMinutes >= range.start && nowMinutes < range.end) {
                span.classList.add('current-period');
            }
        });
    }
});