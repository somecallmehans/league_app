import React, { forwardRef } from "react";
import { Controller } from "react-hook-form";

import Select from "react-select";
import { Checkbox, Input, Label, Field } from "@headlessui/react";

export const Selector = ({
  name,
  options,
  isMulti,
  control,
  placeholder = "",
  register,
  classes,
  defaultValue,
  onChange,
  disabled = false,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      register={register}
      render={({ field }) => (
        <Select
          {...field}
          isMulti={isMulti}
          name={name}
          options={options}
          className={`basic-multi-select ${classes}`}
          classNamePrefix="select"
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.id}
          menuPortalTarget={document.body}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          placeholder={placeholder}
          defaultValue={defaultValue}
          onChange={(selectedOption) => {
            field.onChange(selectedOption);
            if (onChange) onChange(selectedOption); // Calls the custom onChange if provided
          }}
          isDisabled={disabled}
        />
      )}
    />
  );
};

export const CheckBoxInput = forwardRef(
  ({ name, checked, onChange, classes, label }, ref) => {
    return (
      <Field className={`${classes}`}>
        <Checkbox
          name={name}
          checked={checked}
          onChange={onChange}
          ref={ref}
          className="block size-6 rounded border border-slate-400 bg-white data-[checked]:bg-blue-500"
        >
          <svg
            className="stroke-white opacity-0 group-data-[checked]:opacity-100"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M3 8L6 11L11 3.5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Checkbox>
        {label && <Label className="text-xs">{label}</Label>}
      </Field>
    );
  }
);

export const TextInput = ({
  name,
  type,
  placeholder = "",
  classes = "",
  register,
  control,
  defaultValue = "",
  disabled,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      register={register}
      defaultValue={defaultValue}
      render={({ field }) => (
        <Input
          {...field}
          placeholder={placeholder}
          className={`${classes} `}
          type={type}
          disabled={disabled}
          autoComplete="off"
        />
      )}
    />
  );
};
