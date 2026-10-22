// homepage.js — sidebar toggle (mobile) and college-seal fallback.
(function () {
  "use strict";

  var sidebar = document.getElementById("sidebar");
  var scrim = document.getElementById("scrim");
  var menuBtn = document.getElementById("menuBtn");

  function setMenu(open) {
    sidebar.classList.toggle("open", open);
    scrim.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  menuBtn.addEventListener("click", function () {
    setMenu(!sidebar.classList.contains("open"));
  });
  scrim.addEventListener("click", function () { setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 700) setMenu(false);
  });

  // Seal images: the page asks for cec.png first. If that file is missing,
  // fall back to logo.png (both already exist in the repository).
  document.querySelectorAll("img[data-seal]").forEach(function (img) {
    img.addEventListener("error", function onError() {
      img.removeEventListener("error", onError);
      img.src = "logo.png";
    });
  });
})();
