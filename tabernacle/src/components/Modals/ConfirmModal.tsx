import React, { Fragment, useEffect, useState, type ReactNode } from "react";

import StandardButton from "../Button";
import {
  Checkbox,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  bodyText?: ReactNode;
  confirmAction: () => void;
  closeModal: () => void;
  disableSubmit?: boolean;
  enableCheckbox?: boolean;
}

export default function ({
  isOpen,
  title,
  bodyText = "",
  confirmAction,
  closeModal,
  disableSubmit,
  enableCheckbox,
}: ConfirmModalProps) {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsAcknowledged(false);
    }
  }, [isOpen]);

  const requiresAcknowledgment = enableCheckbox === true;
  const isConfirmDisabled =
    disableSubmit || (requiresAcknowledgment && !isAcknowledged);

  const handleConfirm = () => {
    if (requiresAcknowledgment && !isAcknowledged) {
      return;
    }
    confirmAction();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
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
            <DialogPanel className="sm:max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xl transition-all">
              <DialogTitle as="h1" className="text-2xl font-semibold">
                {title}
              </DialogTitle>
              {bodyText != null && bodyText !== "" && (
                <div className="mt-3">{bodyText}</div>
              )}
              {requiresAcknowledgment && (
                <label className="mt-4 flex items-center justify-center gap-3">
                  <Checkbox
                    checked={isAcknowledged}
                    onChange={setIsAcknowledged}
                    className="group block size-5 rounded border border-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 data-[checked]:bg-sky-500"
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
                  <span className="text-sm text-slate-800">I understand</span>
                </label>
              )}
              <div className="mt-4 flex items-center gap-2  sm:justify-center">
                <StandardButton
                  title="Confirm"
                  action={handleConfirm}
                  disabled={isConfirmDisabled}
                />
                <StandardButton title="Cancel" action={closeModal} />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
