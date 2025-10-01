import React from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { apiSlice, useUpdateConfigMutation } from "../../api/apiSlice";

import { Input } from "@headlessui/react";
import LoadingSpinner from "../../components/LoadingSpinner";

const validation = (val, name) => {
  const casted = +val;
  if (casted >= 40) {
    return `Too many participants for ${name}`;
  } else if (casted < 3) {
    return `Not enough participants for ${name}`;
  }

  return undefined;
};

const ConfigRow = ({ name, configKey, value, description }) => {
  const [updateConfig] = useUpdateConfigMutation();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: { value },
  });

  const submit = async (value) => {
    try {
      await updateConfig({ value, key: configKey });
      toast.success("Saved Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error updating config");
    }
  };
  console.log(errors);

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
          <input
            {...register(configKey, {
              validate: (val) => validation(val, name),
            })}
            defaultValue={value}
            type="text"
            className="
            w-full sm:w-64 md:w-80
            border rounded px-2 py-1
            text-left sm:text-right
          "
          />

          <button
            type="submit"
            className="
            w-full sm:w-auto
            px-3 py-1 rounded
            bg-sky-500 hover:bg-sky-400 text-white
            disabled:opacity-50
          "
          >
            Save
          </button>
        </div>
      </form>
    </>
  );
};

export default function Page() {
  const {
    data: { list: configs },
  } = useSelector(apiSlice.endpoints.getAllConfigs.select());

  return (
    <div className="bg-white flex flex-col gap-2 rounded-lg p-4 shadow-md border">
      {configs?.map(({ name, key, value, description }) => (
        <ConfigRow
          key={key}
          configKey={key}
          name={name}
          value={value}
          description={description}
        />
      ))}
    </div>
  );
}
