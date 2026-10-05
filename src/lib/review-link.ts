/** Google's "write a review" address for a place. Safe to use in the browser. */
export function reviewLinkFor(placeId: string) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
