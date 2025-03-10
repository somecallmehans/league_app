import React, { Fragment } from "react";
import CreatableSelect from "react-select/creatable";

import StandardButton from "../Button";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

import {
  useGetParticipantsQuery,
  useGetRoundParticipantsQuery,
} from "../../api/apiSlice";

export default function ({
  isOpen,
  confirmAction,
  closeModal,
  disableSubmit,
  round,
}) {
  //  TODO:   1. Add people who weren't in round originally (whether they're new or not)
  //          2. Remove people who were in the round or added
  //          3. Highlight participants who are new, put them at the top of the list
  //          4. Format the modal
  const { data: roundParticipants, isLoading: roundParticipantsLoading } =
    useGetRoundParticipantsQuery(round, { skip: !isOpen || !round });
  const { data: allParticipants, isLoading: participantsLoading } =
    useGetParticipantsQuery(undefined, { skip: !isOpen || !round });

  if (roundParticipantsLoading || participantsLoading) {
    return null;
  }

  const roundParticipantIds = roundParticipants?.map(({ id }) => id);
  const filteredParticipants = allParticipants
    ?.filter((p1) => !roundParticipantIds.includes(p1.id))
    .map(({ id, name }) => ({ value: id, label: name }));

  const addParticipant = () => {};

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
            <DialogPanel className="w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xl transition-all">
              <DialogTitle as="h1" className="text-2xl font-semibold">
                Reroll Pods?
              </DialogTitle>
              <div className="flex row justify-between">
                <div className="h-64 overflow-y-auto">
                  <span>Players In Round</span>
                  <div className="text-sm">
                    {roundParticipants?.map(({ id, name }) => (
                      <div key={id}>{name}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <CreatableSelect
                    className="mr-2"
                    isClearable
                    options={filteredParticipants}
                    onChange={() => {}}
                    onCreateOption={(inputValue) =>
                      addParticipant({ value: undefined, label: inputValue })
                    }
                    isValidNewOption={(inputValue) => !!inputValue}
                    formatCreateLabel={(option) => `Create ${option}`}
                  />
                </div>
              </div>
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
