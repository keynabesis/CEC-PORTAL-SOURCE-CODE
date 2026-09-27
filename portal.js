const page = document.body.dataset.page;
const main = document.querySelector("#page-content");
const statusNode = document.querySelector("#page-status");
const modal = document.querySelector("#portal-dialog");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let user,
  academics = { courses: [], records: [] },
  config = { mode: "unconfigured" },
  selectedYear = 1,
  selectedSemester = 1;
const portrait =
  '<div class="portrait" aria-label="Profile photo placeholder"><svg aria-hidden="true" viewBox="0 0 80 80"><circle cx="40" cy="25" r="16"/><path d="M10 76a30 30 0 0 1 60 0z"/></svg></div>';
const links = [
 ["subjects", "Enroll in Subjects"],
  ["grades", "Grades"],
  ["announcements", "Announcements"],
  ["schedule", "Class Schedule"],
  ["enrollment", "Enrollment Status"],
  ["records", "Academic Records"],
  ["settings", "Settings"],
  ["profile", "Profile Page"],
];
const publicPage = ["about", "contact"].includes(page);
document.querySelector("#sidebar").innerHTML =
  `<a class="portal-brand" href="${publicPage ? "index" : "dashboard"}.html"><img src="assets/ceclogo.png" alt="School logo placeholder"><span>Cebu Eastern College</span></a><nav aria-label="Portal navigation">${(publicPage
    ? [
        ["index", "Home"],
        ["about", "About"],
        ["contact", "Contact"],
        ["login", "Log In"],
        ["signup", "Sign Up"],
      ]
    : links
  )
    .map(
      ([key, label], i) =>
        `<a href="${key}.html" ${key === page ? 'aria-current="page"' : ""}><span>${publicPage ? "" : String(i + 1).padStart(2, "0")}</span>${label}</a>`,
    )
    .join(
      "",
    )}</nav>${publicPage ? "" : `<div class="sidebar-bottom"><a href="dashboard.html">⌂ Dashboard</a><a href="about.html">♙ About Us</a><button id="logout"><span>⇥</span> LOGOUT</button></div>`}`;
async function api(url, method = "GET", data) {
  const response = await fetch(url, {
    method,
    headers: method === "GET" ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const result = await response.json();
  if (response.status === 401) {
    location.replace("login.html");
    throw Error("Please log in.");
  }
  if (!response.ok)
    throw Error(result.message || "Unable to complete your request.");
  return result;
}
function notify(message) {
  statusNode.textContent = message;
}
function show(title, html) {
  document.querySelector("#dialog-title").textContent = title;
  document.querySelector("#dialog-body").innerHTML = html;
  modal.showModal();
}
document
  .querySelector("#dialog-close")
  .addEventListener("click", () => modal.close());
document.querySelector("#logout")?.addEventListener("click", async () => {
  try {
    await api("/api/logout", "POST", {});
    location.replace("login.html");
  } catch (e) {
    notify(e.message);
  }
});
const heading = (title, subtitle = "") =>
  `<h1>${title}</h1>${subtitle ? `<p class="page-subtitle">${esc(subtitle)}</p>` : ""}`;
const note = () =>
  config.mode === "demo"
    ? '<p class="preview-note">Preview mode · Sample records only. Changes reset when the server restarts.</p>'
    : "";
const studentSummary = () =>
  `<div class="person-summary"><div><p>ID NUMBER: ${esc(user.schoolId)}</p><p>STUDENT NAME: ${esc(user.fullName)}</p><p>COURSE/YEAR: ${esc(user.course || "Not assigned")} / ${esc(user.yearLevel || "Not assigned")}</p><p>SECTION: ${esc(user.section || "Not assigned")}</p></div><div><p>ACADEMIC YEAR: 2026–2027</p><p>SEMESTER: ${esc(user.semester || "Not assigned")}</p></div></div>`;
const dl = (items) =>
  `<dl>${items.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value || "Not provided")}</dd>`).join("")}</dl>`;
function profile() {
  main.innerHTML =
    heading("Profile") +
    `<div class="profile-hero">${portrait}<div><h2>${esc(user.fullName.toUpperCase())}</h2><p>${esc(user.course || "Course not assigned")} · ${esc(user.section || "Section not assigned")}</p><p>▣ Student ID: ${esc(user.schoolId)}</p></div><button class="edit-profile" id="edit-profile">✎ Edit Profile</button></div><div class="info-grid"><section class="info-card"><h2>Personal Information</h2>${dl(
      [
        ["♙ Full Name", user.fullName],
        ["▦ Age", user.age],
        ["✉ Email", user.email],
        ["♧ Contact No.", user.contact],
        ["♧ Address", user.address],
      ],
    )}</section><section class="info-card"><h2>Academic Information</h2>${dl([
      ["◇ Course", user.course],
      ["▣ Year Level", user.yearLevel],
      ["♙ Section", user.section],
      ["▦ Semester", user.semester],
    ])}</section></div><section class="info-card account-card"><h2>Account Information</h2>${dl(
      [
        ["♙ Username", user.username],
        ["♙ Password", "••••••••"],
      ],
    )}</section>` +
    note();
  document.querySelector("#edit-profile").onclick = () => {
    show(
      "Edit Profile",
      `<form id="edit-form"><div class="form-grid">${[
        ["fullName", "Full Name", user.fullName],
        ["age", "Age", user.age],
        ["contact", "Contact Number", user.contact],
        ["address", "Address", user.address],
      ]
        .map(
          ([name, label, value]) =>
            `<label>${label}<input name="${name}" value="${esc(value)}" ${["fullName", "contact"].includes(name) ? "required" : ""} maxlength="${name === "age" ? 3 : name === "contact" ? 30 : 100}"></label>`,
        )
        .join(
          "",
        )}</div><p><button class="primary" type="submit">Save Changes</button></p><p role="status" id="edit-status"></p></form>`,
    );
    document.querySelector("#edit-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.target.querySelector("button");
      button.disabled = true;
      try {
        user = await api(
          "/api/profile",
          "PATCH",
          Object.fromEntries(new FormData(event.target)),
        );
        modal.close();
        profile();
        notify("Profile updated.");
      } catch (e) {
        document.querySelector("#edit-status").textContent = e.message;
      } finally {
        button.disabled = false;
      }
    };
  };
}
function grades() {
  main.innerHTML =
    heading(
      "Grades",
      `${user.fullName} · ${user.course || "Course not assigned"} · ${user.section || ""}`,
    ) +
    `<hr class="rule"><div class="term-row"><span>Course grades released by your instructors, term by term.</span><span>${esc(academics.term || "Term not assigned")}</span></div><div class="summary-strip"><div>${esc(academics.gpa ?? "—")}<small>Term weighted average</small></div><div>In progress<small>Standing</small></div><div>${academics.courses.reduce((sum, c) => sum + (Number(c.units) || 0), 0)}<small>Units this term</small></div></div><div class="table-scroll"><table class="grades-table"><thead><tr><th>Course</th><th>Instructors</th><th>Units</th><th>Grade</th></tr></thead><tbody>${academics.courses.map((c) => `<tr><td>${esc(c.code)}<small>${esc(c.name)}</small></td><td>${esc(c.teacher)}</td><td>${esc(c.units)}</td><td class="pending">${esc(c.grade || "Pending")}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">No grades have been published yet.</td></tr>'}</tbody></table></div>` +
    note();
}
function records() {
  const rows =
    selectedYear === 1 && selectedSemester === 1
      ? academics.records || []
      : academics.recordsByTerm?.[`${selectedYear}-${selectedSemester}`] || [];
  main.innerHTML =
    heading(
      "Academic Records",
      `${user.fullName} · ${user.course || "Course not assigned"} · ${user.section || ""}`,
    ) +
    studentSummary() +
    `<div class="term-row"><label>Year <select id="record-year">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${selectedYear === n ? "selected" : ""}>${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} Year</option>`).join("")}</select></label><label>Semester <select id="record-sem"><option value="1" ${selectedSemester === 1 ? "selected" : ""}>First Semester</option><option value="2" ${selectedSemester === 2 ? "selected" : ""}>Second Semester</option></select></label></div><br><div class="table-scroll"><table class="records-table"><thead><tr>${["GRADE", "SUBJECT CODE", "DESCRIPTIVE TITLE", "UNITS", "LEC", "LAB", "PRE-REQUISITES"].map((s) => `<th>${s}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${(Array.isArray(row) ? [...row, ""].slice(0, 7) : [row.grade, row.code, row.title, row.units, row.lec, row.lab, row.prerequisites || ""]).map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("") || '<tr><td colspan="7" class="empty">No records for this term.</td></tr>'}</tbody></table></div><div class="pager"><button class="pill back" id="previous-year" ${selectedYear === 1 ? "disabled" : ""}>BACK</button><button class="pill" id="next-year" ${selectedYear === 4 ? "disabled" : ""}>NEXT YEAR</button><button class="pill" id="next-sem">${selectedSemester === 1 ? "2ND" : "1ST"} SEMESTER</button></div>` +
    note();
  document.querySelector("#record-year").onchange = (e) => {
    selectedYear = Number(e.target.value);
    records();
  };
  document.querySelector("#record-sem").onchange = (e) => {
    selectedSemester = Number(e.target.value);
    records();
  };
  document.querySelector("#previous-year").onclick = () => {
    selectedYear--;
    records();
  };
  document.querySelector("#next-year").onclick = () => {
    selectedYear++;
    records();
  };
  document.querySelector("#next-sem").onclick = () => {
    selectedSemester = selectedSemester === 1 ? 2 : 1;
    records();
  };
}
function schedule() {
  main.innerHTML =
    heading("Class Schedule") +
    studentSummary() +
    `<div class="schedule-box table-scroll"><table><thead><tr>${["EDP CODE", "SUBJECT", "DESCRIPTIVE TITLE", "SCHEDULE", "ROOM", "TYPE", "UNITS"].map((s) => `<th>${s}</th>`).join("")}</tr></thead><tbody>${academics.courses.map((c, i) => `<tr><td>${config.mode === "demo" ? 2611852 + i : esc(c.edp || "—")}</td><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${esc(c.days)}<br>${esc(c.time)}</td><td>${esc(c.room)}</td><td>${esc(c.type || "Lec")}</td><td>${esc(c.units)}</td></tr>`).join("") || '<tr><td colspan="7" class="empty">No schedule assigned yet.</td></tr>'}</tbody></table></div><hr class="rule"><h2 class="detailed-title">DETAILED SCHEDULE</h2><div class="schedule-box table-scroll"><table><thead><tr><th>SUBJECT</th>${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => `<th>${day.toUpperCase()}</th>`).join("")}</tr></thead><tbody>${academics.courses.map((c) => `<tr><td>${esc(c.code)}</td>${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => `<td>${(c.days || "").includes(day) ? esc(c.time) : "VACANT"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` +
    note();
}
async function announcements() {
  const data = await api("/api/announcements");
  const items = data.items || [];
  const card = (item, i) =>
    `<article class="news-card"><span class="tag ${esc(item.category)}">${esc(item.category)}</span><h3>${esc(item.title)}</h3><small>${esc(item.date)}</small><p>${esc(item.body)}</p><button data-news="${i}">Read more</button></article>`;
  main.innerHTML =
    heading("ANNOUNCEMENTS") +
    `<hr class="rule"><div class="announcement-layout"><section>${
      items
        .slice(0, 3)
        .map((item, i) => card(item, i))
        .join("") || '<p class="empty">No announcements yet.</p>'
    }</section><section>${items
      .slice(3)
      .map((item, i) => card(item, i + 3))
      .join("")}</section></div>` +
    note();
  document.querySelectorAll("[data-news]").forEach(
    (button) =>
      (button.onclick = () => {
        const item = items[Number(button.dataset.news)];
        show(item.title, `<p>${esc(item.date)}</p><p>${esc(item.body)}</p>`);
      }),
  );
}
function settings() {
  main.innerHTML =
    heading("Settings") +
    `<div class="settings-hero">${portrait}<div><h2>${esc(user.fullName)}</h2><p>${esc(user.course || "Course not assigned")}</p><p>Student ID: ${esc(user.schoolId)}</p></div><a href="profile.html">View Profile</a></div><div class="settings-links"><button id="preferences">Privacy and Notifications</button><button id="payment">Payment Methods</button><a href="schedule.html">Subjects</a><a href="grades.html">Grades</a><button id="report">Report</button></div>` +
    note();
  document.querySelector("#preferences").onclick = async () => {
    try {
      const data = await api("/api/preferences");
      show(
        "Privacy and Notifications",
        `<form id="pref-form"><label><input type="checkbox" name="announcements" ${data.announcements ? "checked" : ""}> Announcements</label><label><input type="checkbox" name="assignments" ${data.assignments ? "checked" : ""}> Assignments</label><p>Preferences are saved to your account. Email delivery is not configured.</p><button class="primary">Save Preferences</button><p id="pref-status" role="status"></p></form>`,
      );
      document.querySelector("#pref-form").onsubmit = async (event) => {
        event.preventDefault();
        try {
          await api("/api/preferences", "PUT", {
            announcements: event.target.elements.announcements.checked,
            assignments: event.target.elements.assignments.checked,
          });
          modal.close();
          notify("Preferences saved.");
        } catch (e) {
          document.querySelector("#pref-status").textContent = e.message;
        }
      };
    } catch (e) {
      notify(e.message);
    }
  };
  document.querySelector("#payment").onclick = () =>
    show(
      "Payment Methods",
      "<p>Payment processing is not connected. Please contact the school cashier for payment instructions.</p>",
    );
  document.querySelector("#report").onclick = () => {
    show(
      "Report an issue",
      '<form id="report-form"><label for="report-message">Describe the problem</label><textarea id="report-message" name="message" minlength="10" maxlength="2000" required></textarea><p><button class="primary">Submit Report</button></p><p id="report-status" role="status"></p></form>',
    );
    document.querySelector("#report-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.target.querySelector("button");
      button.disabled = true;
      try {
        const result = await api("/api/report", "POST", {
          message: event.target.elements.message.value,
        });
        modal.close();
        notify(result.message);
      } catch (e) {
        document.querySelector("#report-status").textContent = e.message;
      } finally {
        button.disabled = false;
      }
    };
  };
}
function formField(name, label, value = "", type = "text", required = true) {
  return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" maxlength="200" ${required ? "required" : ""}></label>`;
}
async function enrollment() {
  const saved = await api("/api/enrollment");
  main.innerHTML =
    `<p class="muted">Enrollment Status: ${esc(saved.status)}</p>` +
    heading("Student Enrollment") +
    `<hr class="rule"><form id="enrollment-form"><section class="form-section"><h2>Personal Information</h2><div class="form-grid">${formField("fullName", "Full Name", saved.fullName || user.fullName)}${formField("birthDate", "Date of Birth", saved.birthDate, "date")}<label>Gender<select name="gender"><option>Prefer not to say</option><option>Male</option><option>Female</option></select></label>${formField("age", "Age", saved.age || user.age, "number", false)}${formField("address", "Home Address", saved.address || user.address)}${formField("contact", "Contact Number", saved.contact || user.contact, "tel")}${formField("email", "Email Address", saved.email || user.email, "email")}</div></section><section class="form-section"><h2>Guardian / Emergency Contact</h2><div class="form-grid">${formField("guardian", "Guardian Name", saved.guardian)}${formField("relationship", "Relationship", saved.relationship)}${formField("guardianContact", "Contact Number", saved.guardianContact, "tel")}</div></section><section class="form-section"><h2>Educational Background</h2><div class="form-grid">${formField("lastSchool", "Last School Attended", saved.lastSchool)}<label>Year Level<select name="yearLevel" required><option value="">Select Year</option>${["1st Year", "2nd Year", "3rd Year", "4th Year"].map((x) => `<option ${saved.yearLevel === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Course<select name="course" required><option value="">Select Course</option>${["BSIT", "BSCS", "BSBA", "BSED", "BEED"].map((x) => `<option ${saved.course === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Student Type<select name="studentType"><option>New Student</option><option>Returning Student</option><option>Transferee</option></select></label></div></section><section class="form-section requirements"><h2>Requirements</h2>${["PSA Birth Certificate", "Form 138 / Report Card", "Certificate of Good Moral Character", "Student Photo"].map((x) => `<p>${x}<span>Submit to school office</span></p>`).join("")}<p>Document upload is not configured. The form submits your enrollment information only.</p></section><label class="confirmation"><input type="checkbox" name="confirm" required>I confirm that the information above is accurate and ready for review.</label><button class="primary" type="submit">Submit Enrollment</button></form>` +
    note();
  const form = document.querySelector("#enrollment-form");
  if (saved.gender) form.elements.gender.value = saved.gender;
  if (saved.studentType) form.elements.studentType.value = saved.studentType;
  form.onsubmit = async (event) => {
    event.preventDefault();
    const button = form.querySelector("[type=submit]");
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      data.confirm = form.elements.confirm.checked;
      const result = await api("/api/enrollment", "POST", data);
      notify(result.message);
      document.querySelector(".muted").textContent =
        "Enrollment Status: Submitted for review";
    } catch (e) {
      notify(e.message);
    } finally {
      button.disabled = false;
    }
  };
}
function about() {
  main.innerHTML = `<article class="about">${heading("About")}<p class="about-intro">Cebu Eastern College has served students in Leon Kilat St., Cebu City for generations, offering programs built around practical skill and steady character.<br>This page is where every student, new or returning, gets to know the institution behind the portal.</p><div class="photo-space" id="campus-photo" role="img" aria-label="Reserved campus photograph">Campus photo space</div><div class="history-grid"><section><h2>Our History</h2><p>Founded to give Cebuano students access to quality, affordable higher education, Cebu Eastern College continues its tradition of learning, character, and service.</p></section><section><h2>Mission</h2><p>To provide accessible, quality education that develops practical skills and strong values.</p><h2>Vision</h2><p>A community of capable, compassionate learners who contribute to society.</p></section></div><div class="facts"><div><strong>1915</strong>Established</div><div><strong>CEC</strong>Legacy of learning</div><div><strong>Cebu</strong>Our community</div><div><strong>∞</strong>Possibilities</div></div><h2>What We Stand For</h2><p>Education, character, and service.</p></article>`;
  const image = new Image();
  image.onload = () => {
    const el = document.querySelector("#campus-photo");
    el.style.backgroundImage = "url('assets/cecpic.jpg')";
    el.textContent = "";
    el.style.border = "0";
  };
  image.src = "assets/cecpic.jpg";
}
async function attendance() {
  const data = await api("/api/student/classwork");
  const records = data.attendance || [];
  const courses = data.courses || [];

  main.innerHTML =
    heading(
      "Attendance",
      `${user.fullName} · ${user.course || "Course not assigned"} · ${user.section || ""}`,
    ) +
    `<hr class="rule">
    <div class="table-scroll">
      <table class="grades-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            records
              .map((record) => {
                const course = courses.find((c) => c.id === record.classId);

                return `<tr>
                  <td>
                    ${esc(course?.code || "Unknown Subject")}
                    <small>${esc(course?.name || "")}</small>
                  </td>
                  <td>${esc(record.date)}</td>
                  <td>${esc(record.status)}</td>
                </tr>`;
              })
              .join("") ||
            '<tr><td colspan="3" class="empty">No attendance records yet.</td></tr>'
          }
        </tbody>
      </table>
    </div>` +
    note();
}

async function assignments() {
  const data = await api("/api/student/classwork");
  const items = data.assignments || [];

  main.innerHTML =
    heading(
      "Assignments",
      `${user.fullName} · ${user.course || "Course not assigned"} · ${user.section || ""}`,
    ) +
    `<hr class="rule">
    <div class="assignment-list">
      ${
        items
          .map(
            (item) =>
              `<article class="info-card">
                <h2>${esc(item.title)}</h2>
                <p><strong>Subject:</strong> ${esc(item.courseName)}</p>
                <p><strong>Due Date:</strong> ${esc(item.dueDate)}</p>
                <p>${esc(item.instructions)}</p>
                ${
                  item.submission
                    ? `<p class="success">Submitted on ${new Date(item.submission.submittedAt).toLocaleString()}</p>`
                    : `<form class="assignment-form" data-id="${esc(item.id)}">
                        <label>
                          Your Answer
                          <textarea name="answer" rows="5" required></textarea>
                        </label>
                        <button class="primary" type="submit">Submit Assignment</button>
                        <p class="assignment-status" role="status"></p>
                      </form>`
                }
              </article>`,
          )
          .join("") ||
        '<p class="empty">No assignments have been published yet.</p>'
      }
    </div>` +
    note();

  document.querySelectorAll(".assignment-form").forEach((form) => {
    form.onsubmit = async (event) => {
      event.preventDefault();

      const button = form.querySelector("button");
      const status = form.querySelector(".assignment-status");

      button.disabled = true;

      try {
        const result = await api("/api/student/submissions", "POST", {
          assignmentId: form.dataset.id,
          answer: form.elements.answer.value,
        });

        status.textContent = result.message;
        await assignments();
      } catch (e) {
        status.textContent = e.message;
      } finally {
        button.disabled = false;
      }
    };
  });
}

async function start() {
  try {
    config = await api("/api/config");
    if (publicPage) {
      if (page === "about") about();
      else
        main.innerHTML =
          heading("Contact") +
          '<hr class="rule"><h2>Cebu Eastern College</h2><p>Leon Kilat St., Cebu City</p><div class="photo-space" id="contact-photo">Campus / location photo space</div><p>Contact information can be added here when provided by the school.</p>';

      const contactImage = new Image();
      contactImage.onload = () => {
        const el = document.querySelector("#contact-photo");
        el.style.backgroundImage = "url('assets/cecpic.jpg')";
        el.textContent = "";
        el.style.border = "0";
      };
      contactImage.src = "assets/cecpic.jpg";

      return;
    }
    user = await api("/api/profile");
    if (["grades", "schedule", "records"].includes(page))
      academics = await api("/api/academics");
    const routes = {
      profile,
      grades,
      records,
      schedule,
      settings,
      announcements,
      enrollment,
      assignments,
      attendance,
    };
    if (routes[page]) await routes[page]();
    else
      main.innerHTML =
        heading(page === "assignments" ? "Assignments" : "Attendance") +
        '<hr class="rule"><p class="empty">No published records yet. These records must be supplied by your school.</p>' +
        note();
  } catch (e) {
    main.innerHTML =
      "<h1>Unable to load this page</h1><p>Please try again after checking your connection or server configuration.</p>";
    notify(e.message);
  }
}
if(page!=='subjects')start();
window.addEventListener("pageshow", (event) => {
  if (event.persisted && !publicPage) location.reload();
});

