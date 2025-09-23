import white from "./W.svg";
import blue from "./U.svg";
import black from "./B.svg";
import red from "./R.svg";
import green from "./G.svg";
import colorless from "./C.svg";

export const imgs = {
  white,
  blue,
  black,
  red,
  green,
  colorless,
} as const;

export type ColorKey = keyof typeof imgs; 