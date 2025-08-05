import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function Drawer({ isOpen, onClose, title, children }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="w-full sm:w-[700px] bg-zinc-50 shadow-xl">
                  <div className="flex items-center justify-between px-4 py-4 border-b">
                    <div className="text-lg font-medium text-gray-900">
                      {title}
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      X
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(100vh-4rem)]">
                    {children}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
