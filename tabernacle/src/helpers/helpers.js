export const podCalculator = (len) => {
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

export const handleNavClick = (label) => {
  window.gtag("event", "nav_click", {
    link_text: label,
  });
};

export const hexToRgb = (hex) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};
