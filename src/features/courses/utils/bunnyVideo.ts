/**
 * Bunny Stream embed URL resolution. Kept separate from VideoEmbed.tsx so
 * the URL logic is unit-testable without rendering React.
 *
 * `video_url` (the existing free-text column, shared with youtube/vimeo -
 * see migration 006) accepts either shape for a 'bunny' lesson:
 *   1. A full embed URL, exactly as copied from Bunny's dashboard
 *      ("Embed" button on a video) - used as-is, no config required.
 *   2. A bare video GUID - combined with NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID
 *      into Bunny's standard embed URL format. Requires that env var to be
 *      set; if it isn't, this returns null (caller falls back to the
 *      "video coming soon" placeholder rather than rendering a broken
 *      iframe).
 *
 * The embed URL format (https://iframe.mediadelivery.net/embed/{library}/{video})
 * is Bunny's own long-standing public embed convention, not
 * account-specific - it is not a secret and is safe to construct
 * client-side. The Library ID itself is also not sensitive (it is visible
 * in this same URL to anyone who views the page source of any embed), so
 * NEXT_PUBLIC_ exposure is intentional and safe. No Bunny API key is ever
 * used here - only the embed surface, never the management API.
 */

const BUNNY_EMBED_HOST = "https://iframe.mediadelivery.net/embed";

export function resolveBunnyEmbedUrl(videoRef: string | null | undefined, libraryId: string | undefined): string | null {
  const trimmed = videoRef?.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (!libraryId) return null;

  return `${BUNNY_EMBED_HOST}/${libraryId}/${trimmed}`;
}
