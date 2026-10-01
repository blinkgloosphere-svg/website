"use client";

import { useState, useTransition } from "react";
import { Loader } from "@/components/ui/icons";
import type { ActionResult } from "@/app/admin/actions";

type Props = {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  disabled?: boolean;
  onResult?: (r: ActionResult) => void;
};

/** Runs a server action on click, with optional confirmation and inline result. */
export function ActionButton({ action, children, className = "btn btn-secondary btn-sm", confirm: confirmText, disabled, onResult }: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={disabled || pending}
        className={className}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            const r = await action();
            setResult(r);
            onResult?.(r);
            setTimeout(() => setResult(null), 4000);
          });
        }}
      >
        {pending ? <Loader className="size-4 animate-spin" /> : null}
        {children}
      </button>
      {result ? <span className={`t-small ${result.ok ? "text-success" : "text-danger"}`}>{result.ok ? result.message ?? "Done" : result.error}</span> : null}
    </span>
  );
}
