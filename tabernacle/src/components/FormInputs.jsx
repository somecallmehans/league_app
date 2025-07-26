import React, { forwardRef } from "react";
import { Controller } from "react-hook-form";

import Select from "react-select";
import { Checkbox, Input, Label, Field } from "@headlessui/react";

const customStyles = {
  option: (styles, { isDisabled }) => {
    return {
      ...styles,
      backgroundColor: isDisabled ? "" : "",
      color: isDisabled ? "black" : "",
      cursor: isDisabled ? "not-allowed" : "default",
    };
  },
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const CustomMultiValue = ({ data, handleRemove, selectProps }) => {
  return (
    <div className="flex items-center p-2 border border-gray-300 rounded-md bg-gray-100">
      {data.name}
      <button
        onClick={() => handleRemove(data?.tempId, selectProps?.value)} // react-select handles the removal internally
      >
        <i className="fa-solid fa-x text-xs" />
      </button>
    </div>
  );
};

export const MultiSelector = ({
  name,
  options,
  control,
  placeholder,
  classes,
  disabled,
  isClearable,
  getOptionLabel,
  getOptionValue,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        return (
          <Select
            {...field}
            isMulti
            name={name}
            options={options}
            className={`basic-multi-select ${classes}`}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuPlacement="auto"
            styles={customStyles}
            placeholder={placeholder}
            isDisabled={disabled}
            isClearable={isClearable}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
          />
        );
      }}
    />
  );
};

export const AchievementSelector = ({
  name,
  options,
  control,
  placeholder,
  classes,
  disabled,
  isClearable,
  getOptionLabel,
  getOptionValue,
}) => {
  const uuidv4 = () => crypto.randomUUID();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const handleChange = (selectedOption) => {
          if (!selectedOption) return;
          const entries = selectedOption.map((sO) => ({
            ...sO,
            tempId: uuidv4(),
          }));
          field.onChange(entries);
        };

        const handleRemove = (id, list) => {
          const toRemove = list?.filter(({ tempId }) => tempId !== id);
          field.onChange(toRemove);
        };

        return (
          <Select
            {...field}
            isMulti
            name={name}
            options={options}
            className={`basic-multi-select ${classes}`}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuPlacement="auto"
            styles={customStyles}
            placeholder={placeholder}
            isDisabled={disabled}
            isClearable={isClearable}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            hideSelectedOptions={false}
            onChange={handleChange}
            components={{
              MultiValueContainer: (props) => (
                <CustomMultiValue {...props} handleRemove={handleRemove} />
              ),
            }}
          />
        );
      }}
    />
  );
};

export const Selector = ({
  name,
  options,
  control,
  placeholder = "",
  classes,
  defaultValue,
  disabled = false,
  isClearable,
  getOptionLabel,
  getOptionValue,
  filterOption,
  rules,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        return (
          <>
            {fieldState.error && (
              <span className="text-red-500 text-xs">
                {fieldState.error.message}
              </span>
            )}
            <Select
              {...field}
              name={name}
              options={options}
              className={`basic-multi-select ${classes}`}
              classNamePrefix="select"
              getOptionLabel={getOptionLabel}
              getOptionValue={getOptionValue}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              menuPlacement="auto"
              styles={customStyles}
              placeholder={placeholder}
              defaultValue={defaultValue}
              onChange={(selectedOption) => {
                field.onChange(selectedOption);
              }}
              isDisabled={disabled}
              isClearable={isClearable}
              filterOption={filterOption}
              isOptionDisabled={(option) => option.disabled}
            />
          </>
        );
      }}
    />
  );
};

export const CheckBoxInput = forwardRef(
  (
    { name, checked, onChange, classes, checkboxClasses, label, disabled },
    ref
  ) => {
    return (
      <Field className={`${classes}`}>
        {label && <Label className="text-xs">{label}</Label>}
        <Checkbox
          name={name}
          checked={checked}
          onChange={onChange}
          ref={ref}
          className={`block size-6 rounded border border-slate-400 bg-white data-[checked]:bg-blue-500 ${checkboxClasses} ${
            disabled ? "bg-gray-400" : ""
          }`}
          disabled={disabled}
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
