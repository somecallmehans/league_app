import { Fragment, type ReactNode } from "react";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import StandardButton from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: ReactNode;
  action: () => void;
  actionTitle: string;
  closeTitle: string;
  closeModal: () => void;
  disableConfirm?: boolean;
  body?: ReactNode;
}

export default function Modal({
  isOpen,
  title,
  action,
  actionTitle,
  closeTitle,
  closeModal,
  body,
  disableConfirm,
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
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-xl transform text-center rounded-2xl bg-white text-left align-middle shadow-xl transition-all p-4">
                <DialogTitle
                  as="h3"
                  className="mb-2 text-xl font-medium leading-6 text-gray-900 p-2"
                >
                  {title}
                </DialogTitle>
                {body}
                <StandardButton
                  title={actionTitle}
                  action={action}
                  disabled={disableConfirm}
                />
                <StandardButton title={closeTitle} action={closeModal} />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
