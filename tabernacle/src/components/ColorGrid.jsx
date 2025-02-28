import React from "react";

import imgs from "../../public/images";

export default function ColorGrid({
  show,
  colors,
  containerClasses,
  submitted,
  action,
  noHover,
}) {
  if (!submitted) {
    return;
  }
  if (!show) {
    return (
      <div onClick={action}>
        <i
          className={`fa-solid fa-skull-crossbones text-xl md:text-3xl ${
            noHover ? "" : "hover:text-sky-400"
          } cursor-pointer`}
        />
      </div>
    );
  }

  return (
    <div
      onClick={action}
      className={`flex gap-2 justify-center ${
        noHover ? "" : "clickable-icon"
      } ${containerClasses}`}
    >
      {colors?.split(" ")?.map((c, idx) => (
        <img key={idx} className="w-4 h-4 md:w-6 md:h-6" src={imgs[c]} />
      ))}
    </div>
  );
}
