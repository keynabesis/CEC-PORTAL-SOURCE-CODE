"use strict";
const screen = document.querySelector("#screen"),
  status = document.querySelector("#status");
const params = new URLSearchParams(location.search),
  view = params.get("view") || "home";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let user,
  classes = [],
  selected,
  detail;
async function api(url, method = "GET", data) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw Error("Open this page through the Node.js server, not Live Server.");
  const result = await response.json();
  if (response.status === 401) {
    location.assign("login.html");
    throw Error("Please log in.");
  }
  if (!response.ok)
    throw Error(result.message || "Unable to complete request.");
  return result;
}
const table = (heads, rows) =>
  '<div class="table"><table><thead><tr>' +
  heads.map((h) => "<th>" + esc(h) + "</th>").join("") +
  "</tr></thead><tbody>" +
  rows
    .map(
      (row) =>
        "<tr>" + row.map((x) => "<td>" + esc(x) + "</td>").join("") + "</tr>",
    )
    .join("") +
  "</tbody></table></div>";
const input = (name, label, type = "text", value = "") =>
  "<label>" +
  esc(label) +
  '<input name="' +
  name +
  '" type="' +
  type +
  '" value="' +
  esc(value) +
  '" required></label>';
const studentSelect = () =>
  '<label>Student<select name="studentId" required><option value="">Select a student</option>' +
  detail.students
    .map(
      (s) =>
        '<option value="' +
        esc(s.id) +
        '">' +
        esc(s.fullName) +
        " · " +
        esc(s.schoolId) +
        "</option>",
    )
    .join("") +
  "</select></label>";
const submit = '<button type="submit">Publish</button><p role="status"></p>';
function bindForm(endpoint) {
  const form = screen.querySelector("form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      if (view !== "profile") data.classId = selected;
      const result = await api(
        endpoint,
        view === "profile" ? "PATCH" : "POST",
        data,
      );
      if (view === "profile") {
        user = await api("/api/profile");
        document.querySelector("#identity").textContent = user.fullName;
      }
      await render();
      status.textContent = result.message;
    } catch (error) {
      form.querySelector("[role=status]").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}
function classPicker() {
  return (
    '<label>Teaching class<select id="class-picker">' +
    classes
      .map(
        (c) =>
          '<option value="' +
          esc(c.id) +
          '" ' +
          (c.id === selected ? "selected" : "") +
          ">" +
          esc(c.code + " · " + c.name) +
          "</option>",
      )
      .join("") +
    "</select></label>"
  );
}
async function render() {
  if (view === "profile") {
    screen.innerHTML =
      '<h1>My Profile</h1><div class="panel"><span class="badge">Teacher · ' +
      esc(user.schoolId) +
      "</span><p>" +
      esc(user.email) +
      '</p><form><div class="form-grid">' +
      input("fullName", "Full name", "text", user.fullName) +
      input("contact", "Contact number", "tel", user.contact) +
      '</div><label>Address<input name="address" value="' +
      esc(user.address) +
      '"></label><label>Age<input name="age" type="number" min="1" max="120" value="' +
      esc(user.age) +
      '"></label>' +
      submit +
      '</form></div><div class="photo-space">Reserved space for your faculty photo</div>';
    bindForm("/api/profile");
    return;
  }
  if (view === "home") {
    const units = classes.reduce((n, c) => n + Number(c.units || 0), 0),
      count = classes.reduce((n, c) => n + c.studentCount, 0);
    screen.innerHTML =
      '<section class="banner"><div><p>' +
      esc(
        new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      ) +
      "</p><h1>Welcome back, " +
      esc(user.fullName) +
      '</h1><p>Here’s a quick look at your classes and teaching activities.</p></div><div class="term">Current term<br><strong>' +
      esc(classes[0]?.term || "Not assigned") +
      '</strong></div></section><section class="stats"><article class="stat">Teaching Classes<strong>' +
      classes.length +
      '</strong>Assigned subjects</article><article class="stat">Class Enrollments<strong>' +
      count +
      '</strong>Total across your classes</article><article class="stat">Teaching Units<strong>' +
      units +
      '</strong>Currently assigned</article></section><h2>▥ &nbsp; My Classes</h2><div class="cards">' +
      classes
        .map(
          (c) =>
            '<a class="course" href="?view=classes&class=' +
            encodeURIComponent(c.id) +
            '"><h2>' +
            esc(c.name) +
            "</h2><p>" +
            esc(c.code + " · " + c.section) +
            "</p><hr><p>▦ " +
            esc(c.days) +
            "</p><p>◷ " +
            esc(c.time) +
            "</p><p>⌖ " +
            esc(c.room) +
            "</p><p>" +
            c.studentCount +
            " students</p></a>",
        )
        .join("") +
      "</div>" +
      (!classes.length
        ? "<p>No classes assigned. Ask your school administrator to assign your classes.</p>"
        : "");
    return;
  }
  if (!classes.length) {
    screen.innerHTML =
      "<h1>My Classes</h1><p>No classes have been assigned to your account yet.</p>";
    return;
  }
  detail = await api("/api/teacher/class?id=" + encodeURIComponent(selected));
  const titles = {
    classes: "Class Roster",
    grades: "Gradebook",
    assignments: "Assignments",
    attendance: "Attendance",
    announcements: "Announcements",
  };
  screen.innerHTML =
    "<h1>" +
    esc(titles[view] || "My Classes") +
    "</h1>" +
    classPicker() +
    '<div id="view-content"></div>';
  screen.querySelector("#class-picker").onchange = (e) => {
    location.search =
      "?view=" +
      encodeURIComponent(view) +
      "&class=" +
      encodeURIComponent(e.target.value);
  };
  const target = screen.querySelector("#view-content"),
    names = new Map(detail.students.map((s) => [s.id, s.fullName]));
  if (view === "classes") {
    target.innerHTML =
      '<div class="panel"><h2>' +
      esc(detail.course.name) +
      "</h2><p>" +
      esc(
        detail.course.days +
          " · " +
          detail.course.time +
          " · " +
          detail.course.room,
      ) +
      "</p>" +
      table(
        ["School ID", "Student", "Grade"],
        detail.students.map((s) => [
          s.schoolId,
          s.fullName,
          s.grade || "Pending",
        ]),
      ) +
      "</div>";
    return;
  }
  if (view === "grades") {
    target.innerHTML =
      '<div class="panel">' +
      table(
        ["School ID", "Student", "Grade", "Feedback"],
        detail.students.map((s) => [
          s.schoolId,
          s.fullName,
          s.grade || "Pending",
          s.feedback,
        ]),
      ) +
      '</div><form class="panel"><h2>Publish a class grade</h2>' +
      studentSelect() +
      input("grade", "Grade (1.00–5.00, INC, or DRP)") +
      '<label>Feedback<textarea name="feedback" maxlength="1000"></textarea></label>' +
      submit +
      '<p class="muted">Updates the class grade. Official GPA and historical records are managed separately.</p></form>';
    bindForm("/api/teacher/grades");
    screen.querySelector("[name=studentId]").onchange = (e) => {
      const s = detail.students.find((s) => s.id === e.target.value);
      screen.querySelector("[name=grade]").value = s?.grade || "";
      screen.querySelector("[name=feedback]").value = s?.feedback || "";
    };
    return;
  }
  if (view === "attendance") {
    target.innerHTML =
      '<form class="panel"><h2>Record attendance</h2><div class="form-grid">' +
      studentSelect() +
      input("date", "Date", "date", new Date().toLocaleDateString("en-CA")) +
      '</div><label>Status<select name="status"><option>Present</option><option>Absent</option><option>Late</option><option>Excused</option></select></label>' +
      submit +
      '</form><div class="panel">' +
      table(
        ["Date", "Student", "Status"],
        detail.attendance
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((a) => [
            a.date,
            names.get(a.studentId) || "Former student",
            a.status,
          ]),
      ) +
      "</div>";
    bindForm("/api/teacher/attendance");
    return;
  }
  if (view === "assignments") {
    target.innerHTML =
      '<form class="panel"><h2>Create assignment</h2><div class="form-grid">' +
      input("title", "Title") +
      input("dueDate", "Due date", "date") +
      '</div><label>Instructions<textarea name="instructions" required maxlength="5000"></textarea></label>' +
      submit +
      "</form>" +
      detail.assignments
        .map(
          (a) =>
            '<article class="panel"><h2>' +
            esc(a.title) +
            '</h2><p class="muted">Due ' +
            esc(a.dueDate) +
            '</p><p class="message">' +
            esc(a.instructions) +
            "</p><details><summary>Student responses (" +
            detail.submissions.filter((s) => s.assignmentId === a.id).length +
            ")</summary>" +
            detail.submissions
              .filter((s) => s.assignmentId === a.id)
              .map(
                (s) =>
                  "<h3>" +
                  esc(names.get(s.studentId) || "Former student") +
                  '</h3><p class="message">' +
                  esc(s.answer) +
                  "</p>",
              )
              .join("") +
            "</details></article>",
        )
        .join("");
    bindForm("/api/teacher/assignments");
    return;
  }
  if (view === "announcements") {
    target.innerHTML =
      '<form class="panel"><h2>Publish to this class</h2>' +
      input("title", "Title") +
      '<label>Announcement<textarea name="body" required maxlength="5000"></textarea></label>' +
      submit +
      "</form>" +
      detail.announcements
        .map(
          (a) =>
            '<article class="panel"><h2>' +
            esc(a.title) +
            '</h2><p class="muted">' +
            esc(a.date) +
            '</p><p class="message">' +
            esc(a.body) +
            "</p></article>",
        )
        .join("");
    bindForm("/api/teacher/announcements");
    return;
  }
  target.innerHTML = "<p>Choose a page from the navigation.</p>";
}
document.querySelector("#logout").onclick = async () => {
  try {
    await api("/api/logout", "POST", {});
    location.assign("login.html");
  } catch (e) {
    status.textContent = e.message;
  }
};
(async () => {
  try {
    user = await api("/api/profile");
    if (user.role !== "teacher") {
      location.replace("dashboard.html");
      return;
    }
    document.querySelector("#identity").textContent = user.fullName;
    document
      .querySelector(
        'nav a[href="?view=' +
          ([
            "home",
            "classes",
            "grades",
            "assignments",
            "attendance",
            "announcements",
            "profile",
          ].includes(view)
            ? view
            : "home") +
          '"]',
      )
      ?.setAttribute("aria-current", "page");
    classes = (await api("/api/teacher/classes")).classes;
    selected =
      classes.find((c) => c.id === params.get("class"))?.id || classes[0]?.id;
    await render();
  } catch (e) {
    screen.textContent = e.message;
  }
})();
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});
