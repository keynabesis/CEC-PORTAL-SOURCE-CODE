(() => {
  const root = document.querySelector("#page-content");

  const escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  async function request(url, data) {
    const r = await fetch(url, {
      method: data ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (r.status === 401) {
      location.assign("login.html");
      throw Error("Please log in.");
    }

    if (!r.headers.get("content-type")?.includes("application/json"))
      throw Error("Start the Node.js server to enroll.");

    const result = await r.json();

    if (!r.ok) throw Error(result.message);

    return result;
  }

  async function load(message = "") {
    try {
      const { items } = await request("/api/student/subjects");

      const classwork = await request("/api/student/classwork");
      const attendance = classwork.attendance || [];

      const groups = new Map();

      for (const c of items) {
        const key = c.term + " / " + c.code;

        if (!groups.has(key)) groups.set(key, []);

        groups.get(key).push(c);
      }

      root.innerHTML =
        '<h1>Enroll in Subjects</h1>' +
        '<p>Choose a subject and the schedule that works for you. Times are in the school’s local time.</p>' +
        '<p role="status" id="enrollment-status"></p>' +
        '<p><a href="schedule.html">View my timetable</a> · <a href="dashboard.html">My dashboard</a></p>' +
        '<div class="subject-grid">' +

        [...groups.values()]
          .map(
            (options, i) => {

              // Find the schedule the student is actually enrolled in
              const enrolledClass = options.find((c) => c.enrolled);

              let attendanceHTML = "";

              if (enrolledClass) {
                const records = attendance.filter(
                  (a) => a.classId === enrolledClass.id,
                );

                if (records.length) {
                  attendanceHTML =
                    '<div class="attendance-status">' +
                    "<strong>Attendance:</strong> " +
                    records
                      .map(
                        (a) =>
                          escape(a.status) +
                          " (" +
                          escape(a.date) +
                          ")",
                      )
                      .join(", ") +
                    "</div>";
                } else {
                  attendanceHTML =
                    '<div class="attendance-status">' +
                    "<strong>Attendance:</strong> No attendance recorded yet" +
                    "</div>";
                }
              }

              return (
                '<form class="subject-card" data-group="' +
                i +
                '">' +

                "<h2>" +
                escape(options[0].name) +
                "</h2>" +

                "<p>" +
                escape(options[0].code) +
                " · " +
                escape(options[0].units) +
                " units</p>" +

                "<p>" +
                escape(options[0].term) +
                "</p>" +

                attendanceHTML +

                '<label for="schedule-' +
                i +
                '">Choose schedule</label>' +

                '<select id="schedule-' +
                i +
                '" name="classId" required>' +

                '<option value="">Select a schedule</option>' +

                options
                  .map(
                    (c) =>
                      '<option value="' +
                      escape(c.id) +
                      '"' +
                      (c.enrolled ? " selected" : "") +
                      ">" +
                      escape(
                        c.section +
                          " · " +
                          c.days +
                          " · " +
                          c.time,
                      ) +
                      (c.enrolled ? " — Enrolled" : "") +
                      "</option>",
                  )
                  .join("") +

                "</select>" +

                '<p class="schedule-detail">Select a schedule to see the teacher and available seats.</p>' +

                '<button class="primary" type="submit" disabled>Enroll in this schedule</button>' +

                "</form>"
              );
            },
          )
          .join("") +

        "</div>" +

        (items.length
          ? ""
          : "<p>No subjects are open for enrollment yet. Check again when the school publishes its schedules.</p>");

      root.querySelector("#enrollment-status").textContent = message;

      root.querySelectorAll("form").forEach((form) => {
        const select = form.querySelector("select");
        const button = form.querySelector("button");
        const info = form.querySelector(".schedule-detail");

        select.onchange = () => {
          const c = items.find((c) => c.id === select.value);

          button.disabled = !c || !!c.unavailable;

          info.textContent = c
            ? c.teacher +
              " · Room " +
              c.room +
              " · " +
              c.availableSeats +
              " seats available. " +
              (c.unavailable || "Ready to enroll.")
            : "Select a schedule to see the teacher and available seats.";
        };

        // Show the enrolled schedule information immediately
        if (select.value) {
          select.onchange();
        }

        form.onsubmit = async (e) => {
          e.preventDefault();

          button.disabled = true;
          select.disabled = true;

          try {
            const result = await request("/api/student/enroll", {
              classId: select.value,
            });

            await load(result.message);
          } catch (error) {
            await load(error.message);
          } finally {
            select.disabled = false;
          }
        };
      });
    } catch (e) {
      root.textContent = e.message;
    }
  }

  load();
})();