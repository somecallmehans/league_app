/* eslint-disable react/jsx-key */
import React, { Fragment, useState, useEffect } from "react";
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

const HelpfulText = ({
  helpText,
  warningText = "THIS IS A DESTRUCTIVE ACTION. IF CONFIRMED CURRENT PODS WILL BE BLOWN AWAY AND REMADE.",
}) => (
  <div className="flex flex-col text-start border-l-2 m-1">
    <span className="text-xs m-1 pl-1 text-slate-500 italic">{helpText}</span>
    <span className="text-xs m-1 pl-1 text-red-500 italic">{warningText}</span>
  </div>
);

const HelpfulTextBlock = ({ roundNumber }) => {
  const helpText = roundNumber
    ? "Updating pods in round 1 will randomly shuffle all participants into new pods.\nNew players can be created and will be randomly shuffled into the round.\nIf you'd just like to reshuffle pods, click confirm."
    : "Updating pods in round 2 will sort participants by their total points this month.\nNew players can be created and will be sorted into the round.";

  return (
    <HelpfulText
      helpText={helpText.split("\n").map((text, i) => (
        <p key={i} className="my-1">
          {text}
        </p>
      ))}
    />
  );
};

export default function ({
  isOpen,
  confirmAction,
  closeModal,
  disableSubmit,
  round,
}) {
  const [selected, setSelected] = useState([]);

  const { data: roundParticipants, isLoading: roundParticipantsLoading } =
    useGetRoundParticipantsQuery(round, { skip: !isOpen || !round });
  const { data: allParticipants, isLoading: participantsLoading } =
    useGetParticipantsQuery(undefined, { skip: !isOpen || !round });

  useEffect(() => {
    if (roundParticipants) setSelected(roundParticipants);
  }, [roundParticipants]);

  if (roundParticipantsLoading || participantsLoading) {
    return null;
  }

  const roundParticipantIds = new Set(roundParticipants?.map(({ id }) => id));
  const selectedIds = new Set(selected?.map(({ id }) => id));
  const filteredParticipants = allParticipants
    ?.filter(({ id }) => !roundParticipantIds.has(id) && !selectedIds.has(id))
    .map(({ id, name }) => ({ value: id, label: name }));

  const removedParticipants = roundParticipants?.filter(
    ({ id }) => !selectedIds.has(id)
  );

  const addParticipant = (participant) => {
    if (!participant) return;
    const updated = [...selected];
    updated.unshift({
      id: participant?.value,
      name: participant?.label,
      isNew: true,
    });
    setSelected(updated);
  };

  const removeParticipant = (idx) => {
    const updated = [...selected.slice(0, idx), ...selected.slice(idx + 1)];
    setSelected(updated);
  };

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
                Select Participants For Pods {selected.length}
              </DialogTitle>
              <HelpfulTextBlock roundNumber={round % 2 !== 0} />
              <div className="flex flex-col">
                <CreatableSelect
                  isClearable
                  options={filteredParticipants}
                  onChange={(option) => addParticipant(option)}
                  onCreateOption={(inputValue) =>
                    addParticipant({ value: undefined, label: inputValue })
                  }
                  placeholder="Add New Participant"
                  isValidNewOption={(inputValue) => !!inputValue}
                  formatCreateLabel={(option) => `Create ${option}`}
                  className="mb-2"
                />
                <div className="h-64 overflow-y-auto">
                  <div className="text-sm">
                    {removedParticipants?.map(({ id, name }, idx) => (
                      <div
                        key={id}
                        className={`${
                          idx % 2 === 0 ? "bg-slate-200" : ""
                        } p-1 flex justify-between items-center`}
                      >
                        <div className="flex-1 text-center text-red-400">
                          {name}
                        </div>
                      </div>
                    ))}
                    {selected?.map(({ id, name, isNew }, idx) => (
                      <div
                        key={id}
                        className={`${
                          (removedParticipants?.length + idx) % 2 === 0
                            ? "bg-slate-200"
                            : ""
                        } p-1 flex justify-between items-center`}
                      >
                        <div
                          className={`flex-1 text-center ${
                            isNew ? "text-sky-600" : ""
                          }`}
                        >
                          {name}
                        </div>
                        <div className="text-right mr-2">
                          <i
                            className="fa-solid fa-trash-can cursor-pointer hover:text-red-400"
                            onClick={() => removeParticipant(idx)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2  sm:justify-center">
                <StandardButton
                  title="Confirm"
                  action={() => confirmAction(selected)}
                  disabled={
                    disableSubmit || [1, 2, 5].includes(selected.length)
                  }
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
