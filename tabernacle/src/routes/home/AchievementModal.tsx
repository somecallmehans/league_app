import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

export type Achievement = {
  id: number;
  name: string;
  points: number;
};

type AchievementModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  achievements: Achievement[];
  colorPoints: number;
};

type LineItemProps = {
  name: string;
  points: number;
};

const LineItem = ({ name, points }: LineItemProps) => (
  <div className="grid grid-cols-4 gap-4 items-center py-3">
    <div className="col-span-3 text-gray-800">
      <div className="font-medium leading-snug">{name}</div>
    </div>

    <div className="col-span-1 text-right whitespace-nowrap">
      <span className="font-bold text-gray-700">{points}</span>{" "}
      <span className="text-gray-500">point{points === 1 ? "" : "s"}</span>
    </div>
  </div>
);

export default function AchievementModal({
  isOpen,
  closeModal,
  achievements,
  colorPoints,
}: AchievementModalProps) {
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
              <DialogPanel className="md:w-9/12 min-w-[50vw] max-w-[80vw] mx-auto transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Achievements
                  </h2>
                </div>

                <div className="border-t" />

                {achievements?.length > 0 && (
                  <div className="divide-y">
                    {achievements?.map(({ id, name, points }) => (
                      <LineItem key={id} name={name} points={points} />
                    ))}
                    <LineItem name="Color ID Points" points={colorPoints} />
                  </div>
                )}

                {!achievements?.length && (
                  <div className="py-6 text-sm text-gray-500">
                    No achievements found.
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
