import type { MetadataRoute } from "next";
import { getTrips } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://siturturismo.com.br";
  const trips = await getTrips();

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/viagens`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/roteiros`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contato`, changeFrequency: "monthly", priority: 0.6 },
    ...trips.map((t) => ({
      url: `${base}/viagens/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...trips.map((t) => ({
      url: `${base}/galeria/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
