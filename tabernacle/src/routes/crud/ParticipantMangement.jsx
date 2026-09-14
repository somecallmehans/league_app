import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  useGetParticipantsQuery,
  usePostUpsertParticipantMutation,
  useGetParticipantAversionsQuery,
  usePostParticipantAversionMutation,
  useDeleteAversionMutation,
} from "../../api/apiSlice";
import { EditButtons, SimpleSelect } from "./CrudComponents";
import { TextInput } from "../../components/FormInputs";
import LoadingSpinner from "../../components/LoadingSpinner";
import StandardButton from "../../components/Button";
import Drawer from "../../components/Drawer";
import { useSearch } from "../../hooks";
import auth from "../../helpers/authHelpers.ts";

const formName = "participantForm";

function AversionsDrawer({ participant, participants, isOpen, onClose }) {
  const { data: aversions = [], isLoading } = useGetParticipantAversionsQuery(
    participant.id,
    { skip: !isOpen || !participant?.id }
  );
  const [postAversion] = usePostParticipantAversionMutation();
  const [deleteAversion] = useDeleteAversionMutation();
  const [adding, setAdding] = useState(false);

  const existingOtherIds = useMemo(
    () => new Set(aversions.map((a) => a.other_participant.id)),
    [aversions]
  );

  const selectOptions = useMemo(
    () =>
      (participants || [])
        .filter(
          (p) =>
            p.id &&
            p.id !== participant.id &&
            !existingOtherIds.has(p.id)
        )
        .map((p) => ({ value: p.id, label: p.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [participants, participant.id, existingOtherIds]
  );

  const handleAdd = async (option) => {
    if (!option?.value || adding) return;
    setAdding(true);
    try {
      await postAversion({
        participantId: participant.id,
        other_participant_id: option.value,
      }).unwrap();
      toast.success(`Aversion added for ${option.label}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (aversionId, otherName) => {
    await deleteAversion({
      aversionId,
      participantId: participant.id,
    }).unwrap();
    toast.success(
      otherName ? `Aversion removed for ${otherName}` : "Aversion removed"
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Aversions — ${participant.name}`}
    >
      <div className="p-4 flex flex-col gap-4">
        <SimpleSelect
          placeholder="Add participant to avoid…"
          options={selectOptions}
          value={null}
          onChange={handleAdd}
          classes="w-full"
          isClearable
        />
        {isLoading ? (
          <LoadingSpinner />
        ) : aversions.length === 0 ? (
          <p className="text-sm text-slate-500">No aversions set.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {aversions.map((aversion) => (
              <li
                key={aversion.id}
                className="flex items-center justify-between py-3 text-base"
              >
                <span>{aversion.other_participant.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    handleRemove(
                      aversion.id,
                      aversion.other_participant.name
                    )
                  }
                  className="text-slate-500 hover:text-red-500"
                  aria-label={`Remove aversion to ${aversion.other_participant.name}`}
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}

const ParticipantRow = ({
  id,
  name,
  is_patreon: isPatreon = false,
  postUpsertParticipant,
  placeholder = "",
  openEdit,
  createCancel,
  showPatreonToggle = false,
  showAversions = false,
  onOpenAversions,
}) => {
  const [editing, setEditing] = useState(openEdit);
  const [patreonSaving, setPatreonSaving] = useState(false);
  const { control, register, handleSubmit } = useForm();

  const handleEdit = async (formData) => {
    const { participantName } = formData;
    await postUpsertParticipant({ id: id, name: participantName }).unwrap();
    setEditing(false);
  };

  const handleDelete = async () => {
    await postUpsertParticipant({
      id: id,
      name: name,
      deleted: true,
    }).unwrap();
  };

  const handlePatreonToggle = async () => {
    if (!id || patreonSaving) return;
    setPatreonSaving(true);
    try {
      await postUpsertParticipant({
        id,
        is_patreon: !isPatreon,
      }).unwrap();
    } finally {
      setPatreonSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleEdit)}
      name={formName}
      className="flex justify-between items-center mb-2 px-4 text-base md:text-lg border-b border-slate-400 gap-4"
    >
      <TextInput
        name="participantName"
        defaultValue={name}
        placeholder={placeholder}
        control={control}
        classes={`bg-transparent data-[focus]:outline-none flex-1 ${
          editing ? "text-sky-600" : ""
        }`}
        disabled={!editing}
        register={{ ...register("participantName") }}
        type="text"
      />
      {showAversions && id && (
        <button
          type="button"
          onClick={() => onOpenAversions({ id, name })}
          className="flex items-center gap-1.5 shrink-0 text-sm text-slate-600 hover:text-sky-600"
        >
          Aversions
          <i className="fa-solid fa-person-circle-xmark" aria-hidden="true" />
        </button>
      )}
      {showPatreonToggle && id && (
        <label className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
          <input
            type="checkbox"
            checked={!!isPatreon}
            disabled={patreonSaving}
            onChange={handlePatreonToggle}
            className="rounded border-slate-400 text-sky-600 focus:ring-sky-400"
          />
          Patreon
        </label>
      )}
      <EditButtons
        editing={editing}
        setEditing={createCancel || setEditing}
        deleteAction={handleDelete}
        formName={formName}
      />
    </form>
  );
};

export default function Page() {
  const [showCreate, setShowCreate] = useState();
  const [aversionParticipant, setAversionParticipant] = useState(null);
  const isSuperuser = auth.isSuperuser();
  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery();

  const [filteredData, Component, FilterList] = useSearch(
    participants || [],
    "Filter by Name"
  );
  const [postUpsertParticipant] = usePostUpsertParticipantMutation();

  const sortedData = [...filteredData].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (participantsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      <div className="flex mb-2">
        <StandardButton
          title={showCreate ? "Cancel" : "New"}
          action={() => setShowCreate(!showCreate)}
        />
        {Component()}
      </div>
      {showCreate && (
        <div className="md:px-64">
          <ParticipantRow
            name=""
            postUpsertParticipant={postUpsertParticipant}
            placeholder="Add Participant Name"
            createCancel={() => setShowCreate(false)}
            openEdit
            showPatreonToggle={isSuperuser}
          />
        </div>
      )}
      <FilterList
        data={sortedData}
        listKey="id"
        classes="md:px-32"
        Component={ParticipantRow}
        componentProps={{
          postUpsertParticipant,
          showPatreonToggle: isSuperuser,
          showAversions: isSuperuser,
          onOpenAversions: setAversionParticipant,
        }}
      />
      {aversionParticipant && (
        <AversionsDrawer
          participant={aversionParticipant}
          participants={participants}
          isOpen={!!aversionParticipant}
          onClose={() => setAversionParticipant(null)}
        />
      )}
    </div>
  );
}
