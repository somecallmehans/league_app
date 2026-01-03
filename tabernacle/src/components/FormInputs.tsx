import { forwardRef } from "react";

import Select, {
  components as selectComponents,
  GroupBase,
  MultiValue,
  Props as ReactSelectProps,
} from "react-select";
import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from "react-hook-form";
import { Checkbox, Input, Label, Field, Textarea } from "@headlessui/react";

type BaseFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues>;
  disabled?: boolean;
  classes?: string;
};

type WithTitleAndErrors<TFieldValues extends FieldValues> = {
  title?: string;
  errors?: FieldErrors<TFieldValues>;
  containerClasses?: string;
};

type GetOptionLabel<TOption> = (option: TOption) => string;
type GetOptionValue<TOption> = (option: TOption) => string;

const customStyles: ReactSelectProps<any, boolean, GroupBase<any>>["styles"] = {
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

type TempIdOption = {
  tempId?: string;
  name: string;
};

type CustomMultiValueProps<TOption extends TempIdOption> = {
  data: TOption;
  selectProps: { value: readonly TOption[] | null };
  handleRemove: (
    id: string | undefined,
    list: readonly TOption[] | null
  ) => void;
};

const CustomMultiValue = <TOption extends TempIdOption>({
  data,
  handleRemove,
  selectProps,
}: CustomMultiValueProps<TOption>) => {
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

type MultiSelectorProps<
  TFieldValues extends FieldValues,
  TOption,
> = BaseFieldProps<TFieldValues> & {
  options: TOption[];
  placeholder?: string;
  isClearable?: boolean;
  getOptionLabel: GetOptionLabel<TOption>;
  getOptionValue: GetOptionValue<TOption>;
};

export const MultiSelector = <TFieldValues extends FieldValues, TOption>({
  name,
  options,
  control,
  placeholder,
  classes,
  disabled = false,
  isClearable = false,
  getOptionLabel,
  getOptionValue,
}: MultiSelectorProps<TFieldValues, TOption>) => {
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

type AchievementOption = {
  id?: number | string;
  achievement_id?: number;
  name: string;
  tempId?: string;
  [key: string]: unknown;
};

type AchievementSelectorProps<
  TFieldValues extends FieldValues,
  TOption extends AchievementOption,
> = BaseFieldProps<TFieldValues> & {
  options: TOption[];
  placeholder?: string;
  isClearable?: boolean;
  getOptionLabel: GetOptionLabel<TOption>;
  getOptionValue: GetOptionValue<TOption>;
};

export const AchievementSelector = <
  TFieldValues extends FieldValues,
  TOption extends AchievementOption,
>({
  name,
  options,
  control,
  placeholder,
  classes,
  disabled,
  isClearable,
  getOptionLabel,
  getOptionValue,
}: AchievementSelectorProps<TFieldValues, TOption>) => {
  const uuidv4 = () => crypto.randomUUID();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const handleChange = (selectedOption: readonly TOption[] | null) => {
          if (!selectedOption) return;
          const entries = selectedOption.map((sO) => ({
            ...sO,
            tempId: uuidv4(),
          }));
          field.onChange(entries);
        };

        const handleRemove = (
          id: string | undefined,
          list: readonly TOption[] | null
        ) => {
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
                <CustomMultiValue<TOption>
                  data={(props as any).data}
                  selectProps={(props as any).selectProps}
                  handleRemove={handleRemove}
                />
              ),
            }}
          />
        );
      }}
    />
  );
};

type SelectorProps<
  TFieldValues extends FieldValues,
  TOption extends { disabled?: boolean },
> = BaseFieldProps<TFieldValues> & {
  title?: string;
  options: TOption[];
  placeholder?: string;
  defaultValue?: TOption;
  isClearable?: boolean;
  getOptionLabel: GetOptionLabel<TOption>;
  getOptionValue: GetOptionValue<TOption>;
  filterOption?: ReactSelectProps<TOption, false>["filterOption"];
  containerClasses?: string;
};

export const Selector = <
  TFieldValues extends FieldValues,
  TOption extends { disabled?: boolean },
>({
  name,
  title = "",
  options,
  control,
  placeholder = "",
  classes = "",
  defaultValue = undefined,
  disabled = false,
  isClearable = false,
  getOptionLabel,
  getOptionValue,
  filterOption,
  rules,
  containerClasses = "",
}: SelectorProps<TFieldValues, TOption>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        return (
          <div className={`flex flex-col ${containerClasses}`}>
            {title ? (
              <label className="font-bold text-lg">{title}</label>
            ) : (
              <div />
            )}
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
              isOptionDisabled={(option) => !!option.disabled}
            />
          </div>
        );
      }}
    />
  );
};

type CheckBoxInputProps = {
  name?: string;
  checked: boolean;
  onChange: (...event: any[]) => void;
  onBlur?: () => void;
  value?: any;
  classes?: string;
  checkboxClasses?: string;
  label?: string;
  disabled?: boolean;
};

export const CheckBoxInput = forwardRef<HTMLInputElement, CheckBoxInputProps>(
  (
    { name, checked, onChange, classes, checkboxClasses, label, disabled },
    ref
  ) => {
    return (
      <Field className={`${classes}`}>
        {label && <Label className="text-xs">{label}</Label>}
        <span
          aria-hidden
          className="flex-1 h-3 border-b border-dotted border-slate-300 mx-1"
        />
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

type TextInputProps<TFieldValues extends FieldValues> =
  BaseFieldProps<TFieldValues> &
    WithTitleAndErrors<TFieldValues> & {
      type?: React.HTMLInputTypeAttribute;
      placeholder?: string;
      defaultValue?: any;
    };

export const TextInput = <TFieldValues extends FieldValues>({
  name,
  title,
  type,
  placeholder = "",
  classes = "",
  control,
  defaultValue = undefined,
  disabled,
  rules,
  errors,
  containerClasses,
}: TextInputProps<TFieldValues>) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={rules}
      render={({ field }) => (
        <div className={`flex flex-col ${containerClasses}`}>
          <div>
            {title ? (
              <label className="font-bold text-lg">{title}</label>
            ) : (
              <div />
            )}
            {errors?.[name] && (
              <span className="text-xs italic text-rose-400 ml-2">
                {(errors[name]?.message as any) ?? "Invalid"}
              </span>
            )}
          </div>
          <Input
            {...field}
            placeholder={placeholder}
            className={`${classes} `}
            type={type}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      )}
    />
  );
};

type TextAreaFieldProps<TFieldValues extends FieldValues> =
  BaseFieldProps<TFieldValues> &
    WithTitleAndErrors<TFieldValues> & {
      placeholder?: string;
      defaultValue?: any;
      rows?: number;
    };

export const TextAreaField = <TFieldValues extends FieldValues>({
  name,
  title,
  placeholder,
  classes = "",
  control,
  defaultValue = undefined,
  disabled,
  rows = 3,
  rules,
  errors,
}: TextAreaFieldProps<TFieldValues>) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={rules}
      render={({ field }) => (
        <>
          <div>
            {title && <label className="font-bold text-lg">{title}</label>}
            {errors?.[name] && (
              <span className="text-xs italic text-rose-400 ml-2">
                {(errors[name]?.message as any) ?? "Invalid"}
              </span>
            )}
          </div>
          <Textarea
            {...field}
            placeholder={placeholder}
            className={`${classes} `}
            disabled={disabled}
            autoComplete="off"
            rows={rows}
          />
        </>
      )}
    />
  );
};
