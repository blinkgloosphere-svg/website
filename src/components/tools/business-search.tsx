"use client";

import { useEffect, useRef, useState } from "react";
import { Loader, Search } from "@/components/ui/icons";

export type Suggestion = { placeId: string; name: string; address: string };

type Props = {
  /** `session` must be passed to the details lookup so Google bills one session. */
  onSelect: (s: Suggestion, session: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** No border or background: for placing the box inside another field, like the homepage rating check. */
  bare?: boolean;
};

/** Google business search box with a suggestion list. Calls the server, never Google directly. */
export function BusinessSearch({ onSelect, placeholder = "Start typing your business name…", autoFocus, bare }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sample, setSample] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const session = useRef<string>("");
  const newSession = () => (session.current = crypto.randomUUID());

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        if (!session.current) newSession();
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&session=${session.current}`, { signal: ctrl.signal });
        const json = (await res.json()) as { suggestions?: Suggestion[]; sample?: boolean; error?: string };
        setError(res.ok ? null : json.error ?? "Search failed. Please try again.");
        setItems(json.suggestions ?? []);
        setSample(!!json.sample);
        setOpen(true);
        setActive(-1);
      } catch {
        /* aborted or failed; keep previous */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(s: Suggestion) {
    setQ(s.name);
    setOpen(false);
    onSelect(s, session.current);
    session.current = ""; // the next search starts a new billing session
  }

  return (
    <div ref={box} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-tertiary" />
        <input
          className={bare ? "h-12 w-full bg-transparent pl-10 pr-10 text-base text-fg outline-none placeholder:text-fg-tertiary" : "input h-12 pl-10 pr-10 text-base"}
          value={q}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") setActive((a) => Math.min(items.length - 1, a + 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
            if (e.key === "Enter" && active >= 0) choose(items[active]);
            if (e.key === "Escape") setOpen(false);
          }}
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        {loading ? <Loader className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-fg-tertiary" /> : null}
      </div>
      {error && q.trim().length >= 2 ? <p className="t-small mt-2 text-danger">{error}</p> : null}
      {open && q.trim().length >= 2 && items.length > 0 ? (
        <ul role="listbox" className={`card absolute z-20 mt-2 max-h-80 w-full overflow-auto p-1 text-left shadow-card ${bare ? "mt-4" : ""}`}>
          {items.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                className={`flex w-full flex-col items-start rounded-md px-3 py-2 text-left ${i === active ? "bg-bg-subtle" : "hover:bg-bg-subtle"}`}
              >
                <span className="t-ui font-medium text-fg">{s.name}</span>
                <span className="t-small text-fg-tertiary">{s.address}</span>
              </button>
            </li>
          ))}
          {sample ? <li className="t-small px-3 py-2 text-fg-tertiary">Sample results. Add a Google key to search real businesses.</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
