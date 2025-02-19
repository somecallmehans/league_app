import React, { Fragment } from "react";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

import { useGetAchievementRoundQuery } from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import ColorGrid from "../../components/ColorGrid";

export default function PointsModal({ isOpen, closeModal, selected }) {
  const { data, isLoading: achievementsLoading } = useGetAchievementRoundQuery(
    {
      participant_id: selected?.participant_id,
      round_id: selected?.roundId,
    },
    { skip: !selected }
  );

  if (achievementsLoading) {
    return <LoadingSpinner />;
  }
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
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center ">
          <div className="flex w-full max-w-3xl items-center justify-center p-4 text-center">
            <TransitionChild
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
              className="flex justify-center"
            >
              <DialogPanel className="md:w-9/12 min-w-[50vw] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="mb-2 text-2xl font-medium leading-6 text-gray-900 flex flex-wrap md:no-wrap justify-center md:justify-between"
                >
                  <span className="text-2xl font-bold">
                    {selected?.participant}
                  </span>
                  {selected?.isWinner && (
                    <div className="flex align-middle gap-2">
                      <span className="text-lg">
                        {selected?.winnerCommander || ""}
                      </span>
                      <ColorGrid
                        show
                        colors={selected?.colors}
                        containerClasses="my-auto"
                        submitted
                      />
                    </div>
                  )}
                </DialogTitle>
                <div className="border-b mb-2" />
                {data?.achievements.map(
                  ({ achievement: { full_name }, earned_points }, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-4 gap-4 items-center ${
                        index < data?.achievements.length - 1
                          ? "border-b border-gray-300 pb-2 mb-2"
                          : ""
                      }`}
                    >
                      <div className="col-span-3 text-left text-gray-800 font-medium">
                        {full_name}
                      </div>
                      <div className="col-span-1 text-right text-gray-600 font-bold">
                        {earned_points} points
                      </div>
                    </div>
                  )
                )}
                <span className="flex justify-end text-lg font-semibold mt-2 border-t border-gray-300">
                  = {selected?.round_points} Round Points
                </span>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
