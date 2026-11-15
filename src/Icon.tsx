type IconName = "sun" | "moon" | "planet" | "arrow-left" | "external" | "image" | "expand" | "close";

const paths: Record<IconName, string> = {
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z",
  planet: "M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0M5 9C1 10 0 13 3 15s9 2 14-1 7-6 4-7l-3-1",
  "arrow-left": "M20 12H4m6-6-6 6 6 6",
  external: "M14 4h6v6m0-6L10 14M11 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-6",
  image: "M4 4h16v16H4ZM4 16l5-5 5 5 3-3 3 3M16 8h.01",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  close: "m6 6 12 12M6 18 18 6",
};

/** Inline artwork stays legible when external font services are unavailable. */
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg className={`ui-icon ${className}`} width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
