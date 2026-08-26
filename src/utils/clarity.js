import { isAdminPath } from "@/utils/paths";

export const CLARITY_PROJECT_ID = "y83iybmxln";

// Microsoft Clarity's official loader snippet, kept verbatim apart from the
// project id being hoisted out. Clarity is for visitor behaviour only, so it is
// never loaded on the admin panel: see public/clarity.js for the standalone
// copy used by the vanilla pages.
export function initClarity(projectId = CLARITY_PROJECT_ID) {
  if (typeof window === "undefined") return;
  if (isAdminPath()) return;
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
  })(window, document, "clarity", "script", projectId);
}
