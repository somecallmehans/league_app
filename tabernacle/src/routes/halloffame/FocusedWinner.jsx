import React from "react";

import { useParams } from "react-router-dom";

export default function FocusedWinner() {
  const { mm_yy } = useParams();

  return <div>Hi {mm_yy}</div>;
}
