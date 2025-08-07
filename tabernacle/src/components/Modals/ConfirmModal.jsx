import React, { Fragment } from "react";

import StandardButton from "../Button";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

export default function ({
  isOpen,
  title,
  bodyText = "",
  confirmAction,
  closeModal,
  disableSubmit,
}) {
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
              {bodyText}
              <div className="mt-4 flex items-center gap-2  sm:justify-center">
                <StandardButton
                  title="Confirm"
                  action={confirmAction}
                  disabled={disableSubmit}
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
