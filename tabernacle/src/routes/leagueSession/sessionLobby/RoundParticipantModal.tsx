import React, { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

import { useGetAchievementRoundQuery } from "../../../api/apiSlice";
import LoadingSpinner from "../../../components/LoadingSpinner";

export type RoundParticipantSummary = {
  participant_id: number;
  name: string;
  total_points: number;
  round_points: number;
  round_id: number;
};

export default function RoundParticipantModal({
  isOpen,
  closeModal,
  selected,
}: {
  isOpen: boolean;
  closeModal: () => void;
  selected?: RoundParticipantSummary;
}) {
  const { data, isLoading } = useGetAchievementRoundQuery(
    selected
      ? { participant_id: selected.participant_id, round_id: selected.round_id }
      : // values ignored due to skip
        { participant_id: -1, round_id: -1 },
    { skip: !selected },
  );

  if (isLoading) return <LoadingSpinner />;

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
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center">
          <div className="flex w-full max-w-2xl items-center justify-center p-4 text-center">
            <TransitionChild
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
              className="flex justify-center w-full"
            >
              <DialogPanel className="w-full transform overflow-hidden rounded-2xl bg-white p-5 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <DialogTitle
                  as="h3"
                  className="text-xl font-semibold text-gray-900 flex flex-col gap-1"
                >
                  <span>{selected?.name}</span>
                  <span className="text-sm font-medium text-slate-600">
                    {selected?.round_points ?? 0} round points ·{" "}
                    {selected?.total_points ?? 0} month points
                  </span>
                </DialogTitle>

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <div className="text-sm font-semibold text-slate-700 mb-2">
                    Achievements this round
                  </div>

                  {(!data || data.length === 0) && (
                    <div className="text-sm text-slate-600">
                      No achievements recorded for this round.
                    </div>
                  )}

                  {data?.map(({ id, full_name, earned_points }, index) => (
                    <div
                      key={id}
                      className={`grid grid-cols-4 gap-3 items-center ${
                        index < (data?.length ?? 0) - 1
                          ? "border-b border-slate-100 pb-2 mb-2"
                          : ""
                      }`}
                    >
                      <div className="col-span-3 text-left text-slate-800 font-medium">
                        {full_name}
                      </div>
                      <div className="col-span-1 text-right text-slate-600 font-bold">
                        {earned_points}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

