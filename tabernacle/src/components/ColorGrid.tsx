import type { MouseEventHandler } from "react";
import { imgs, type ColorKey } from "../../public/images";

const isColorKey = (v: string): v is ColorKey => v in imgs;

interface ColorGridProps {
  show: boolean;
  colors?: string;
  containerClasses?: string;
  submitted: boolean;
  action?: MouseEventHandler<HTMLDivElement>;
  noHover: boolean;
  endInDraw?: boolean;
  isSmall?: boolean;
}

export default function ColorGrid({
  show,
  colors,
  containerClasses,
  submitted,
  action,
  noHover,
  endInDraw,
  isSmall,
}: ColorGridProps) {
  if (!submitted) {
    return;
  }
  if (!show) {
    return (
      <div onClick={action}>
        <i
          className={`fa-solid fa-${endInDraw ? "handshake" : "skull-crossbones"} ${isSmall ? "text-sm md:text-base" : "text-xl md:text-3xl"} ${
            noHover ? "" : "hover:text-sky-400"
          } cursor-pointer`}
        />
      </div>
    );
  }

  const keys = colors?.split(" ").filter(isColorKey);

  return (
    <div
      onClick={action}
      className={`flex gap-2 justify-center ${
        noHover ? "" : "clickable-icon"
      } ${containerClasses}`}
    >
      {keys?.map((c, idx) => (
        <img
          key={idx}
          className={`${isSmall ? "w-3 h-3 md:w-4 md:h-4" : "w-4 h-4 md:w-6 md:h-6"}`}
          src={imgs[c]}
          alt={c}
        />
      ))}
    </div>
  );
}
