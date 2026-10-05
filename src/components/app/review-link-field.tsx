"use client";

import { useState } from "react";
import { BusinessSearch, type Suggestion } from "@/components/tools/business-search";
import { reviewLinkFor } from "@/lib/review-link";

/**
 * Google review link with a business search on top: pick the business and the
 * correct link fills in by itself. The link can still be typed or pasted.
 */
export function ReviewLinkField({ initial, disabled, onPick }: { initial: string; disabled?: boolean; onPick?: (s: Suggestion) => void }) {
  const [link, setLink] = useState(initial);
  const [found, setFound] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div>
        <p className="label">Find the business on Google</p>
        {disabled ? (
          <input className="input" disabled placeholder="Search is off in preview mode" />
        ) : (
          <BusinessSearch
            placeholder="Type the business name as it appears on Google Maps…"
            onSelect={(s) => {
              setLink(reviewLinkFor(s.placeId));
              setFound(`${s.name}, ${s.address}`);
              onPick?.(s);
            }}
          />
        )}
      </div>
      <div>
        <label htmlFor="reviewLink" className="label">
          Google review link
        </label>
        <input
          id="reviewLink"
          name="reviewLink"
          className="input"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setFound(null);
          }}
          placeholder="https://search.google.com/local/writereview?placeid=…"
          disabled={disabled}
        />
        <p className="t-small mt-1.5 text-fg-tertiary">
          {found ? (
            <>
              Filled in for <span className="font-medium text-fg-secondary">{found}</span>.{" "}
            </>
          ) : null}
          {link ? (
            <a href={link} target="_blank" rel="noopener" className="font-medium text-fg-secondary underline underline-offset-2 hover:text-fg">
              Test the link
            </a>
          ) : (
            "Search above, or paste a link that starts with search.google.com/local/writereview."
          )}
        </p>
      </div>
    </div>
  );
}
