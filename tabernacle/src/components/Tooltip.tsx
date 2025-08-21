import { useState } from "react";

interface TooltipProps {
  delay?: number;
  direction?: "top" | "bottom" | "left" | "right";
  content: React.ReactNode;
  children: React.ReactNode;
}

const Tooltip = ({ delay, direction = "top", content, children }: TooltipProps) => {
  let timeout: NodeJS.Timeout | undefined;
  const [active, setActive] = useState(false);

  const showTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, delay || 400);
  };

  const hideTip = () => {
    clearTimeout(timeout);
    setActive(false);
  };

  return (
    <div
      className="Tooltip-Wrapper"
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {children}
      {active && (
        <div className={`Tooltip-Tip ${direction}`}>{content}</div>
      )}
    </div>
  );
};

export default Tooltip;
