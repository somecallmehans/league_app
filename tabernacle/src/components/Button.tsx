
import { Button } from "@headlessui/react";
import type { ComponentProps, MouseEventHandler, ReactNode } from "react";

type ButtonBaseProps = Omit<
  ComponentProps<typeof Button>,
  "onClick" | "type" | "disabled" | "children" | "className"
>;

export type StandardButtonProps = ButtonBaseProps & {
  title: ReactNode;
  action?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
};

export default function StandardButton({
  title,
  action,
  disabled,
  type = "button",
}: StandardButtonProps) {
  return (
    <Button
      onClick={action}
      className="md:min-w-40 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none px-4 py-2 min-w-24 self-end mr-2 rounded bg-sky-600 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
      disabled={disabled}
      type={type}
    >
      {title}
    </Button>
  );
}
