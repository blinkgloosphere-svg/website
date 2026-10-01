import { cn as clsx } from "@/lib/cn";

type Props = {
  value: number;
  size?: number;
  className?: string;
  /** Colour for filled stars. Defaults to brand yellow. */
  color?: string;
  emptyColor?: string;
};

/** Static star row. Supports half values (e.g. 4.5). */
export function Stars({ value, size = 20, className, color = "#F5B400", emptyColor = "#E3E4E6" }: Props) {
  return (
    <span className={clsx("inline-flex items-center gap-1", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return <Star key={i} fill={fill} size={size} color={color} emptyColor={emptyColor} />;
      })}
    </span>
  );
}

function Star({ fill, size, color, emptyColor }: { fill: number; size: number; color: string; emptyColor: string }) {
  const id = `g${Math.round(fill * 100)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset={`${fill * 100}%`} stopColor={color} />
          <stop offset={`${fill * 100}%`} stopColor={emptyColor} />
        </linearGradient>
      </defs>
      <path
        fill={fill >= 1 ? color : fill <= 0 ? emptyColor : `url(#${id})`}
        d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z"
      />
    </svg>
  );
}
