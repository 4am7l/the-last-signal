export const destinations = ["moon", "mars"] as const;
export type Destination = (typeof destinations)[number];
export type Page = "home" | "archive" | "guide" | "explore";
export type View = "overview" | "planet" | "surface";
export type Route = { page: Page; body: Destination; mode: View };

export function parseRoute(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const page: Page = ["archive", "guide", "explore"].includes(path) ? (path as Page) : "home";
  const params = new URLSearchParams(query);
  const view = params.get("view");
  // Older mission links still open the corresponding body and general view.
  const legacyMission = params.get("mission");
  const body = params.get("body") ??
    (legacyMission && legacyMission !== "apollo" ? "mars" : "moon");
  const mode = view === "planet" ? "planet" :
    view === "surface" || view === "model" || view === "location" ? "surface" : "overview";
  return { page, body: body === "mars" ? "mars" : "moon", mode };
}

export function exploreHref(body: Destination, mode: View = "overview") {
  return `#/explore?body=${body}&view=${mode}`;
}
