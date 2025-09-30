import React from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { apiSlice } from "../../api/apiSlice";

import { Input } from "@headlessui/react";
import LoadingSpinner from "../../components/LoadingSpinner";

const ConfigRow = ({ name, configKey, value, description }) => {
  const { control, register, handleSubmit, reset } = useForm({
    defaultValues: { value },
  });

  return (
    <form
      onSubmit={handleSubmit(() => {})}
      className="py-3
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
        <Input
          name={configKey}
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
  );
};

export default function Page() {
  const { data: configs } = useSelector(
    apiSlice.endpoints.getAllConfigs.select()
  );

  return (
    <div className="bg-white flex flex-col gap-4 rounded-lg p-4 shadow-md border">
      {configs?.map((config) => (
        <>
          <ConfigRow key={config.key} configKey={config.key} {...config} />
        </>
      ))}
    </div>
  );
}
