/* Review Console — page behaviour.
   Scroll-spy nav, copy-email, dossier accordion, external-link helper.
   Behaviour preserved from the October 2026 build. */
(function () {
  "use strict";

  /* Scroll-spy: the section whose band contains scrollY + 120 wins. */
  var SECTIONS = ["about", "impact", "skills", "experience", "game"];
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll("[data-spy]")
  );

  function spy() {
    var probe = window.scrollY + 120;
    var current = SECTIONS[0];
    for (var i = 0; i < SECTIONS.length; i++) {
      var el = document.getElementById(SECTIONS[i]);
      if (!el) continue;
      var top = el.offsetTop;
      if (probe >= top && probe < top + el.offsetHeight) {
        current = SECTIONS[i];
        break;
      }
    }
    navLinks.forEach(function (a) {
      if (a.getAttribute("data-spy") === current) {
        a.setAttribute("aria-current", "location");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", spy);
  window.addEventListener("load", spy);
  spy();

  /* Copy email: clipboard API with textarea fallback, 1.8s confirmation. */
  var EMAIL = "aviral.prz@gmail.com";
  var copyStatus = document.getElementById("copy-status");
  function flash(btn) {
    var original = btn.getAttribute("data-label") || "Copy email";
    btn.textContent = "Copied \u2713";
    if (copyStatus) copyStatus.textContent = "Email address copied to clipboard.";
    setTimeout(function () {
      btn.textContent = original;
    }, 1800);
  }
  function copyEmail(btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(
        function () { flash(btn); },
        function () { legacyCopy(btn); }
      );
    } else {
      legacyCopy(btn);
    }
  }
  function legacyCopy(btn) {
    var area = document.createElement("textarea");
    area.value = EMAIL;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (e) { /* no-op */ }
    document.body.removeChild(area);
    flash(btn);
  }
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-copy-email]"),
    function (btn) {
      btn.setAttribute("data-label", btn.textContent);
      btn.addEventListener("click", function () { copyEmail(btn); });
    }
  );

  /* Dossier accordion: one open at a time; clicking the open one closes it. */
  var toggles = Array.prototype.slice.call(
    document.querySelectorAll(".dossier-toggle")
  );
  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var panel = document.getElementById(
        toggle.getAttribute("aria-controls")
      );
      var article = toggle.closest(".dossier");
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggles.forEach(function (other) {
        if (other === toggle) return;
        var otherPanel = document.getElementById(
          other.getAttribute("aria-controls")
        );
        var otherArticle = other.closest(".dossier");
        other.setAttribute("aria-expanded", "false");
        if (otherPanel) otherPanel.hidden = true;
        var otherSign = other.querySelector(".dossier-sign");
        if (otherSign) otherSign.textContent = "+";
        var otherPreview = otherArticle
          ? otherArticle.querySelector(".dossier-preview")
          : null;
        if (otherPreview) otherPreview.hidden = false;
      });
      toggle.setAttribute("aria-expanded", String(!isOpen));
      if (panel) panel.hidden = isOpen;
      var sign = toggle.querySelector(".dossier-sign");
      if (sign) sign.textContent = isOpen ? "+" : "\u2212";
      var preview = article ? article.querySelector(".dossier-preview") : null;
      if (preview) preview.hidden = !isOpen;
    });
  });

  /* External links open in a new tab with noopener. */
  function markExternal(a) {
    var href = a.getAttribute("href");
    if (!href) return;
    try {
      var url = new URL(href, document.baseURI);
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.host !== location.host
      ) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    } catch (e) { /* ignore unparseable hrefs */ }
  }
  function markAll() {
    document.querySelectorAll("a[href]").forEach(markExternal);
  }
  markAll();
  document.addEventListener(
    "click",
    function (e) {
      var a =
        e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (a) markExternal(a);
    },
    true
  );
})();
