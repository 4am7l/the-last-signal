export type Page = "home" | "archive" | "guide" | "explore";
export type View = "overview" | "planet" | "story" | "model" | "location";
export type Route = { page: Page; mission: string; mode: View };
const views: View[] = ["overview", "planet", "story", "model", "location"];
export function parseRoute(hash: string, ids: readonly string[]): Route {
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const page: Page = ["archive", "guide", "explore"].includes(path)
    ? (path as Page)
    : "home";
  const params = new URLSearchParams(query),
    requested = params.get("mission") || "";
  return {
    page,
    mission: ids.includes(requested) ? requested : ids[0],
    mode: views.includes(params.get("view") as View)
      ? (params.get("view") as View)
      : "overview",
  };
}
export function exploreHref(mission: string, mode: View = "model") {
  return `#/explore?mission=${encodeURIComponent(mission)}&view=${mode}`;
}
export function matchesMission(
  m: { name: string; en: string; site: string; body: string },
  query: string,
  body: string,
) {
  const normalize = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[\u064b-\u065f\u0670]/g, "")
      .replace(/[أإآ]/g, "ا")
      .toLowerCase()
      .trim();
  return (
    (body === "all" || m.body === body) &&
    normalize(
      `${m.name} ${m.en} ${m.site} ${m.body} ${m.body === "moon" ? "القمر" : "المريخ"}`,
    ).includes(normalize(query))
  );
}
