/**
 * Resolve an official NASA image asset to its highest available resolution.
 * The asset manifest is fetched only when a visitor opens the lightbox.
 */
type Manifest = { collection?: { items?: Array<{ href?: string }> } };

function isAllowedImage(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "https:" &&
      (url.hostname === "nasa.gov" || url.hostname.endsWith(".nasa.gov")) &&
      /\.(jpe?g|png|webp)(?:$|\?)/i.test(url.href);
  } catch {
    return false;
  }
}

function score(href: string) {
  if (/~orig\./i.test(href)) return 5;
  if (/~large\./i.test(href)) return 4;
  if (/~medium\./i.test(href)) return 3;
  if (/~small\./i.test(href)) return 2;
  return 1;
}

export async function onRequestGet({ request }: { request: Request }): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[\w.-]{1,100}$/.test(id)) {
    return Response.json({ error: "Invalid NASA ID" }, { status: 400 });
  }
  try {
    const response = await fetch("https://images-api.nasa.gov/asset/" + encodeURIComponent(id));
    if (!response.ok) throw new Error("NASA asset unavailable");
    const manifest = (await response.json()) as Manifest;
    const options = (manifest.collection?.items ?? [])
      .map((x) => x.href)
      .filter((x): x is string => Boolean(x) && isAllowedImage(x!))
      .sort((a, b) => score(b) - score(a));
    return Response.json(
      { full: options[0] ?? null },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch {
    return Response.json({ full: null }, { status: 200 });
  }
}
