import { Fragment, ReactNode } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { TextInput } from "../FormInputs";
import { Checkbox } from "@headlessui/react";

import StandardButton from "../Button";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { SignInResponse } from "../../types/round_schemas";

const textValidate = (val: string | undefined) => {
  if (!val) return "Code is required";

  if (val.length != 6) return "Code must be 6 characters";

  return undefined;
};

interface SignInFormProps {
  onSubmit?: (payload: {
    code: string;
    rounds: number[];
  }) => Promise<void> | void;
  closeModal: () => void;
  disabled?: boolean;
  ids: number[];
  signIns: SignInResponse;
}

type FormValues = {
  code: string;
  rounds: { r1: boolean; r2: boolean };
  roundsGroup?: boolean;
};

const SignInForm = ({
  onSubmit,
  closeModal,
  disabled,
  ids,
  signIns,
}: SignInFormProps) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { code: "", rounds: { r1: false, r2: false } },
  });

  const [one, two] = ids;
  if (!one || !two) return;

  const oneFull = signIns[one]?.is_full;
  const twoFull = signIns[two]?.is_full;

  const submit: SubmitHandler<FormValues> = async (values) => {
    if (!values.rounds.r1 && !values.rounds.r2) {
      setError("rounds", {
        type: "manual",
        message: "Select at least one round",
      });
      return;
    }

    const rounds: number[] = [];
    if (values.rounds.r1) rounds.push(one);
    if (values.rounds.r2) rounds.push(two);

    await onSubmit?.({
      code: values.code.trim().toUpperCase(),
      rounds,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <TextInput
        name="code"
        title=""
        type="text"
        placeholder="Enter code e.g. ABCDEF"
        control={control}
        errors={errors}
        disabled={isSubmitting}
        classes="text-sm w-full border rounded-lg p-2"
        rules={{
          validate: (value) => textValidate(value as string | undefined),
        }}
        containerClasses=""
      />
      <fieldset className="rounded-lg border border-slate-200 p-3 sm:p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">
          Rounds
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Round 1 */}
          <Controller
            name="rounds.r1"
            control={control}
            render={({ field }) => (
              <label
                className={`flex items-center gap-3 rounded-md p-2 ${oneFull ? "bg-slate-300" : "hover:bg-slate-50"}`}
              >
                <Checkbox
                  name={field.name}
                  checked={!!field.value}
                  onChange={(v: boolean) => field.onChange(v)}
                  disabled={disabled || isSubmitting || oneFull}
                  className={`group block size-5 rounded border border-slate-400 ${oneFull ? "bg-slate-200" : "bg-white"} focus:outline-none focus:ring-2 focus:ring-sky-400 data-[checked]:bg-sky-500`}
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
                <span className="text-sm text-slate-800">Round 1, 1:30PM</span>
              </label>
            )}
          />

          {/* Round 2 */}
          <Controller
            name="rounds.r2"
            control={control}
            render={({ field }) => (
              <label
                className={`flex items-center gap-3 rounded-md p-2 ${twoFull ? "bg-slate-300" : "hover:bg-slate-50"}`}
              >
                <Checkbox
                  name={field.name}
                  checked={!!field.value}
                  onChange={(v: boolean) => field.onChange(v)}
                  disabled={disabled || isSubmitting || twoFull}
                  className={`group block size-5 rounded border border-slate-400 ${twoFull ? "bg-slate-200" : "bg-white"} focus:outline-none focus:ring-2 focus:ring-sky-400 data-[checked]:bg-sky-500`}
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
                <span className="text-sm text-slate-800">Round 2, 3:30PM</span>
              </label>
            )}
          />
        </div>
        {errors?.rounds && (
          <span className="text-xs italic text-rose-400 ml-2">
            {errors?.rounds?.message}
          </span>
        )}
      </fieldset>

      <div className="mt-2 flex justify-end gap-2 sm:justify-center">
        <StandardButton title="Cancel" action={closeModal} />
        <StandardButton
          title="Confirm"
          type="submit"
          disabled={(oneFull && twoFull) || isSubmitting}
        />
      </div>
    </form>
  );
};

interface ModalProps {
  isOpen: boolean;
  title: ReactNode;
  action: () => void;
  actionTitle: string;
  closeTitle: string;
  closeModal: () => void;
  disableConfirm?: boolean;
  body?: ReactNode;
  ids: number[];
  signIns: SignInResponse;
}

export default function ({
  isOpen,
  closeModal,
  action,
  title,
  ids,
  signIns,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-[90vw] max-w-2xl max-h-[90vh] transform overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-xl transition-all">
              <DialogTitle as="h1" className="text-2xl font-semibold mb-2">
                {title}
              </DialogTitle>
              <SignInForm
                onSubmit={action}
                closeModal={closeModal}
                ids={ids}
                signIns={signIns}
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
