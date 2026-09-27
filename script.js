const dialog = document.querySelector("#information-dialog");
const title = document.querySelector("#dialog-title");
const content = document.querySelector("#dialog-content");
const detail = document.querySelector("#dialog-detail");
let lastTrigger;
let panelRequest = 0;

document.querySelectorAll("[data-panel]").forEach((trigger) => {
  trigger.addEventListener("click", async (event) => {
    event.preventDefault();
    lastTrigger = trigger;
    const requestId = ++panelRequest;
    const panel = trigger.dataset.panel;
    const titles = {
      about: "About Cebu Eastern College",
      contact: "Contact",
      login: "Log in",
      signup: "Sign up",
    };
    title.textContent = titles[panel];
    detail.textContent = "";
    content.textContent = "Loading…";
    dialog.showModal();
    if (panel === "login" || panel === "signup") {
      content.textContent = "The student account portal is not connected yet.";
      detail.textContent =
        "This landing-page template does not create accounts or collect passwords.";
      return;
    }
    try {
      const response = await fetch("/api/college");
      if (!response.ok) throw new Error("Request failed");
      const college = await response.json();
      if (requestId !== panelRequest || !dialog.open) return;
      content.textContent = panel === "about" ? college.message : college.name;
      detail.textContent = college.address;
    } catch {
      if (requestId !== panelRequest || !dialog.open) return;
      content.textContent =
        "College information is currently unavailable. Please try again later.";
    }
  });
});
document
  .querySelector(".close-dialog")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  panelRequest++;
  lastTrigger?.focus();
});
