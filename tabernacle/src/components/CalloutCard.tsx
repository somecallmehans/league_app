import type { ReactNode } from "react";

export type CalloutCardProps = {
  tag: string;
  title: string;
  items: ReactNode[];
  className?: string;
  tagClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  bulletClassName?: string;
};

export default function CalloutCard({
  tag,
  title,
  items,
  className = "rounded-lg border border-sky-200 bg-sky-50/70 p-2.5 sm:p-4",
  tagClassName = "bg-sky-600",
  titleClassName = "text-sm font-semibold text-sky-900 leading-snug",
  bodyClassName = "mt-2 space-y-1.5 text-xs sm:text-sm text-sky-800 leading-relaxed",
  bulletClassName = "text-sky-500",
}: CalloutCardProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <span
          className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px] ${tagClassName}`}
        >
          {tag}
        </span>
        <p className={titleClassName}>{title}</p>
      </div>

      <ul className={bodyClassName}>
        {items.map((item, idx) => (
          <li key={`${tag}-${idx}`} className="flex items-start gap-1.5">
            <span
              className={`mt-0.5 shrink-0 text-base leading-none ${bulletClassName}`}
              aria-hidden
            >
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
