let profile,
  courses = [];
const routes = {
  "Academic Records": "records",
  "View Schedule": "schedule",
  "Student Grades": "grades",
  Assignments: "assignments",
  Attendance: "attendance",
  Announcements: "announcements",
  "Account Settings": "profile",
  "Notification Preferences": "settings",
  "About Us": "about",
};
document.querySelectorAll("[data-section]").forEach((button) =>
  button.addEventListener("click", () => {
    const route = routes[button.dataset.section];
    if (route) {
      location.href = route + ".html";
      return;
    }
    show(button.dataset.section, [
      "No messages or notifications have been published yet.",
    ]);
  }),
);
const dialog =
  document.querySelector("#information-dialog") ||
  document.querySelector("#detail-dialog");
function show(title, lines) {
  document.querySelector("#detail-title").textContent = title;
  const content = document.querySelector("#detail-content");
  content.replaceChildren();
  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = line;
    content.append(p);
  }
  dialog.showModal();
}
document.querySelector("#close-dialog").onclick = () => dialog.close();
document.querySelector("#today").textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());
function render() {
  const query = document.querySelector("#search").value.toLowerCase().trim();
  const items = courses.filter((c) =>
    Object.values(c).join(" ").toLowerCase().includes(query),
  );
  const grid = document.querySelector("#courses");
  grid.replaceChildren();
  for (const course of items) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "course-card";
    const h3 = document.createElement("h3");
    h3.textContent = `${course.name} – ${course.code}`;
    card.append(h3);
    for (const [icon, value] of [
      ["♟", course.teacher],
      ["▦", course.days],
      ["◷", course.time],
      ["●", course.room],
    ]) {
      const p = document.createElement("p");
      p.textContent = `${icon}  ${value}`;
      card.append(p);
    }
    card.onclick = () =>
      show(course.name, [
        course.code,
        course.teacher,
        course.days,
        course.time,
        `Room: ${course.room}`,
      ]);
    grid.append(card);
  }
  document.querySelector("#no-results").hidden = items.length > 0;
  document.querySelector("#no-results").textContent = courses.length
    ? "No courses match your search."
    : "No courses assigned yet.";
}
document.querySelector("#search").oninput = render;
document.querySelector("#view-all").onclick = () =>
  (location.href = "schedule.html");
document.querySelector("#logout").onclick = async () => {
  try {
    const r = await fetch("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!r.ok) throw Error();
    location.replace("login.html");
  } catch {
    document.querySelector("#page-status").textContent =
      "Unable to log out. Please try again.";
  }
};
async function get(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 401) {
    location.replace("login.html");
    throw Error("Please log in.");
  }
  const data = await response.json();
  if (!response.ok) throw Error(data.message);
  return data;
}
async function load() {
  try {
    profile = await get("/api/profile");
    const data = await get("/api/academics");
    courses = data.courses || [];
    document.querySelector("#student-name").textContent =
      profile.fullName || profile.username;
    document.querySelector(".avatar").textContent = (
      profile.fullName || profile.username
    ).charAt(0);
    const cards = document.querySelectorAll(".stats article");
    cards[0].querySelector("p").textContent = data.gpa ?? "—";
    cards[0].querySelectorAll("p")[1].textContent = data.gpa
      ? "Good standing"
      : "Not published";
    cards[1].querySelector("p").textContent = courses.length;
    cards[2].querySelector("p").textContent = data.assignments || 0;
    cards[3].querySelector("p").textContent = courses.reduce(
      (n, c) => n + (Number(c.units) || 0),
      0,
    );
    document.querySelector(".term strong").textContent =
      data.term || "Not assigned";
    document.querySelector(".demo-note").textContent = data.demo
      ? "Preview mode · Sample academic data."
      : "Academic information published by your school.";
    render();
  } catch (e) {
    document.querySelector("#page-status").textContent =
      e.message || "Unable to load your dashboard.";
  }
}
load();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});
