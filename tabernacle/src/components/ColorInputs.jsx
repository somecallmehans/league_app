import React from "react";
import { Controller } from "react-hook-form";

import { CheckBoxInput } from "./FormInputs";

const colors = ["White", "Blue", "Black", "Red", "Green", "Colorless"];

export const ColorCheckboxes = ({ control }) => {
  return (
    <div className="flex justify-between mb-2">
      {colors.map((color) => (
        <Controller
          name={`colors.${color}`}
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <CheckBoxInput
              {...field}
              classes="flex flex-col items-center"
              label={color}
              checked={field.value}
            />
          )}
        />
      ))}
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