import React, { useState } from "react";

const Tooltip = ({ delay, direction, content, children }) => {
  let timeout;
  const [active, setActive] = useState(false);

  const showTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, delay || 400);
  };

  const hideTip = () => {
    clearInterval(timeout);
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
        <div className={`Tooltip-Tip ${direction || "top"}`}>{content}</div>
      )}
    </div>
  );
};

export default Tooltip;
