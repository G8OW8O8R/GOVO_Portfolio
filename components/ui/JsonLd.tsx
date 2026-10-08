import { serializeJsonLd } from "@/lib/seo";

/** Structured data (schema.org) of a page, in the server HTML. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
