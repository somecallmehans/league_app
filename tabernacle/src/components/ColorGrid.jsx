import React from "react";

import imgs from "../../public/images";

export default function ColorGrid({
  show,
  colors,
  containerClasses,
  submitted,
}) {
  if (!submitted) {
    return;
  }
  if (!show) {
    return (
      <div>
        <i className="fa-solid fa-skull-crossbones text-2xl" />
      </div>
    );
  }
  return (
    <div className={`flex gap-2 justify-center ${containerClasses}`}>
      {colors?.split(" ")?.map((c, idx) => (
        <img key={idx} className="w-6 h-6" src={imgs[c]} />
      ))}
    </div>
  );
}
