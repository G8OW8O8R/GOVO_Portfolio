/**
 * Skills that come alive on hover, by
 * skill id from content/profile/skills.ts. Shared by the server-rendered
 * skills panel and the client demos.
 */
export const LIVE_THUMBS = ["grafika-realtime", "animacje-ui"] as const;
export type LiveThumbId = (typeof LIVE_THUMBS)[number];
export const isLiveThumb = (id: string): id is LiveThumbId => (LIVE_THUMBS as readonly string[]).includes(id);

/** The row that shows the live BTC price next to its thumbnail. */
export const LIVE_DATA_SKILL = "api-dane-na-zywo";
