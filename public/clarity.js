// Microsoft Clarity loader for the vanilla pages that are not part of the Vite
// build (resume.html). The React entries use src/utils/clarity.js instead.
// Keep the project id in sync with CLARITY_PROJECT_ID there.
(function () {
  if (/(^|\/)admin(\/|$)/.test(window.location.pathname)) return;
  if (window.clarity) return;

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "y83iybmxln");
})();
