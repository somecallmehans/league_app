export const podCalculator = (len: number): string => {
  let threePods = 0;
  let fourPods = 0;
  let fivePods = 0;

  if (len <= 2) {
    return "Not enough players to begin round";
  }

  while (len > 0) {
    if ((len - 5) % 4 === 0 || len === 5) {
      fivePods += 1;
      len -= 5;
    } else if (len % 4 === 0 || len === 7 || len - 4 >= 6) {
      fourPods += 1;
      len -= 4;
    } else {
      threePods += 1;
      len -= 3;
    }
  }

  return `${fivePods} Five Pods, ${fourPods} Four Pods, ${threePods} Three Pods`;
};

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "consent" | string,
      nameOrId: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export const handleNavClick = (label: string) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return;
  window.gtag("event", "nav_click", { link_text: label });
};

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): RGB | null => {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  if (!/^[\da-fA-F]{6}$/.test(clean)) return null;

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};
