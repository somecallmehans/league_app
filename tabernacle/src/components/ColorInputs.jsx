import React from "react";
import { Controller } from "react-hook-form";

import { CheckBoxInput } from "./FormInputs";

const colorKeys = ["White", "Blue", "Black", "Red", "Green", "Colorless"];

const disableColorBoxes = (colors, currColor) => {
  if (!colors) return false;
  if (colors["Colorless"] && currColor !== "Colorless") return true;
  if (
    currColor === "Colorless" &&
    Object.values(colors).some((val, i) => val && colorKeys[i] !== "Colorless")
  ) {
    return true;
  }

  return false;
};

export const ColorCheckboxes = ({ control, watch }) => {
  const { colors, endInDraw } = watch();
  return (
    <div className="flex justify-between mb-2">
      {colorKeys.map((color) => {
        const disabled = disableColorBoxes(colors, color) || endInDraw;
        return (
          <React.Fragment key={color}>
            <Controller
              name={`colors.${color}`}
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <CheckBoxInput
                  {...field}
                  classes="flex flex-col items-center"
                  checkboxClasses={disabled ? "bg-gray-400" : ""}
                  label={color}
                  checked={field.value}
                  disabled={disabled}
                />
              )}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const colorIdFinder = (colors, colorsData) => {
  const selectedColors = Object.keys(colors).filter((color) => colors[color]);

  const matchedColor = colorsData.find((colorData) =>
    selectedColors.every((color) => colorData.name.includes(color))
  );

  return matchedColor ? matchedColor.id : null;
};
