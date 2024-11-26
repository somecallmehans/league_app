import React, { Fragment } from "react";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

export default function PointsModal({ isOpen, closeModal, selected }) {
  if (!selected) return null;
  const { participant, achievements, round_points } = selected;

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
          <div className="flex min-h-4/5 items-center justify-center p-4 text-center">
            <TransitionChild
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-9/12 min-w-[65vw] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="mb-2 text-xl font-medium leading-6 text-gray-900 flex justify-between"
                >
                  <span>Points for {participant}</span>
                  <span>{round_points} Round Points</span>
                </DialogTitle>

                {achievements.map(({ name, point_value }, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-4 gap-4 items-center ${
                      index < achievements.length - 1
                        ? "border-b border-gray-300 pb-2 mb-2"
                        : ""
                    }`}
                  >
                    <div className="col-span-3 text-left text-gray-800 font-medium">
                      {name}
                    </div>
                    <div className="col-span-1 text-right text-gray-600 font-bold">
                      {point_value} points
                    </div>
                  </div>
                ))}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
