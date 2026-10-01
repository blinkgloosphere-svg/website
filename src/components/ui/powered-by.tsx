import Image from "next/image";
import { cn } from "@/lib/cn";

/** Yellow "Powered by Blink" pill with the Blink icon. */
export function PoweredByBlink({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = {
    sm: { pad: "h-8 pl-2 pr-3.5 gap-1.5 text-[13px]", icon: 22 },
    md: { pad: "h-10 pl-2.5 pr-4 gap-2 text-[15px]", icon: 28 },
    lg: { pad: "h-12 pl-3 pr-5 gap-2.5 text-[17px]", icon: 34 },
  }[size];
  return (
    <span className={cn("inline-flex items-center rounded-full bg-[#FFC21A] font-semibold tracking-[-0.01em] text-[#0b0b0c]", s.pad, className)}>
      <Image src="/brand/blink-mark-160.png" alt="" width={s.icon} height={s.icon} className="shrink-0" />
      Powered by Blink
    </span>
  );
}
