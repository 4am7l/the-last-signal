const queries: Record<string, { search: string; needle: RegExp }> = {
  apollo: { search: "Apollo 11 lunar surface", needle: /apollo[ -]?11|as11/i },
  opportunity: { search: "Mars Opportunity rover", needle: /opportunity/i },
  spirit: { search: "Mars Spirit rover", needle: /spirit/i },
  insight: { search: "InSight Mars lander", needle: /insight/i },
  ingenuity: { search: "Ingenuity Mars helicopter", needle: /ingenuity/i },
};

type NasaItem = {
  data?: Array<{
    nasa_id?: string;
    title?: string;
    description?: string;
    date_created?: string;
    center?: string;
  }>;
  links?: Array<{ href?: string; rel?: string; render?: string }>;
};
type NasaResponse = { collection?: { items?: NasaItem[] } };

function officialImage(href: string | undefined) {
  if (!href) return null;
  try {
    const url = new URL(href);
    return url.protocol === "https:" &&
      (url.hostname === "nasa.gov" || url.hostname.endsWith(".nasa.gov"))
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function onRequestGet({ request }: { request: Request }): Promise<Response> {
  const mission = new URL(request.url).searchParams.get("mission") ?? "";
  const configuration = queries[mission];
  if (!configuration) {
    return Response.json({ error: "Unknown mission" }, { status: 400 });
  }

  const params = new URLSearchParams({
    q: configuration.search,
    media_type: "image",
    page_size: "70",
  });
  try {
    const response = await fetch("https://images-api.nasa.gov/search?" + params);
    if (!response.ok) throw new Error("NASA API returned " + response.status);
    const json = (await response.json()) as NasaResponse;
    const seen = new Set<string>();
    const photos = (json.collection?.items ?? [])
      .flatMap((item) => {
        const details = item.data?.[0];
        const nasaId = details?.nasa_id;
        if (!nasaId || !details.title || seen.has(nasaId)) return [];
        const haystack = (details.title + " " + (details.description ?? "")).slice(0, 3000);
        if (!configuration.needle.test(haystack)) return [];
        const thumbnail = officialImage(
          item.links?.find((link) => link.render === "image")?.href ??
          item.links?.[0]?.href,
        );
        if (!thumbnail) return [];
        seen.add(nasaId);
        return [{
          id: nasaId,
          title: details.title.slice(0, 170),
          thumbnail,
          description: (details.description ?? "").replace(/<[^>]*>/g, "").slice(0, 330),
          date: (details.date_created ?? "").slice(0, 10),
          center: (details.center ?? "NASA").slice(0, 90),
          source: "https://images.nasa.gov/details-" + encodeURIComponent(nasaId),
        }];
      })
      .slice(0, 10);

    return Response.json(
      { mission, photos, attribution: "NASA Image and Video Library" },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch {
    return Response.json(
      { mission, photos: [], error: "NASA image service temporarily unavailable" },
      { status: 200, headers: { "Cache-Control": "public, max-age=120" } },
    );
  }
}
