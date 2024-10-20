import React from "react";

import { Button } from "@headlessui/react";

export default function StandardButton({
  title,
  action,
  disabled,
  type = "button",
}) {
  return (
    <Button
      onClick={action}
      className="min-w-40 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none px-4 py-2 min-w-24 self-end mr-2 rounded bg-sky-600 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
      disabled={disabled}
      type={type}
    >
      {title}
    </Button>
  );
}
