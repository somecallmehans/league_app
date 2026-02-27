import React from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { apiSlice, useUpdateConfigMutation } from "../../api/apiSlice";

import { Input } from "@headlessui/react";

const numberValidation = (val, name) => {
  const casted = +val;
  if (casted >= 99) {
    return `Too many participants for ${name}`;
  } else if (casted < 3) {
    return `Not enough participants for ${name}`;
  }
  return undefined;
};

const ConfigRow = ({
  name,
  configKey,
  value,
  description,
  isGlobal,
  configType = "text",
  options = [],
}) => {
  const [updateConfig] = useUpdateConfigMutation();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: { [configKey]: value },
  });

  const submit = async (formVals) => {
    try {
      let next = formVals[configKey];
      if (configType === "checkbox") {
        next = next ? "true" : "false";
      }
      await updateConfig({ value: next, key: configKey });
      toast.success("Saved Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error updating config");
    }
  };

  const inputClass =
    "w-full sm:w-64 md:w-80 border rounded px-2 py-1 text-left sm:text-right focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

  const renderInput = () => {
    if (configType === "select" && options.length > 0) {
      return (
        <select
          {...register(configKey)}
          disabled={isGlobal}
          defaultValue={value}
          className={inputClass}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (configType === "checkbox") {
      return (
        <input
          type="checkbox"
          {...register(configKey)}
          disabled={isGlobal}
          defaultChecked={value === "true"}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
      );
    }
    return (
      <input
        {...register(configKey, {
          validate:
            configType === "number"
              ? (val) => numberValidation(val, name)
              : undefined,
        })}
        disabled={isGlobal}
        defaultValue={value}
        type="text"
        className={inputClass}
      />
    );
  };

  return (
    <>
      <span className="text-sm italic text-red-500">
        {errors && errors[configKey]?.message}
      </span>
      <form
        onSubmit={handleSubmit(submit)}
        className="
    flex flex-col gap-3
    sm:flex-row sm:items-center sm:justify-between
  "
      >
        <div className="min-w-0">
          <div className="font-medium">{name}</div>
          {description && (
            <span className="text-sm italic text-slate-500">{description}</span>
          )}
        </div>
        <div
          className="
          flex flex-col gap-2
          sm:flex-row sm:items-center sm:justify-end
          sm:gap-3
          w-full sm:w-auto
        "
        >
          {renderInput()}

          <button
            type="submit"
            className="
            w-full sm:w-auto
            px-3 py-1 rounded
            bg-sky-500 hover:bg-sky-400 text-white
            disabled:bg-slate-400
          "
            disabled={isGlobal}
          >
            Save
          </button>
        </div>
      </form>
    </>
  );
};

export default function Page() {
  const { data } = useSelector(apiSlice.endpoints.getAllConfigs.select());
  const configs = data?.list ?? [];

  return (
    <div className="bg-white flex flex-col gap-2 rounded-lg p-4 shadow-md border">
      {configs?.map(
        ({
          name,
          key,
          value,
          description,
          scope_kind,
          config_type,
          options,
        }) => (
          <ConfigRow
            key={key}
            configKey={key}
            name={name}
            value={value}
            description={description}
            isGlobal={scope_kind === "global"}
            configType={config_type}
            options={options}
          />
        )
      )}
    </div>
  );
}
