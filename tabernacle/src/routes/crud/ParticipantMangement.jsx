import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useGetParticipantsQuery,
  usePostUpsertParticipantMutation,
} from "../../api/apiSlice";
import { EditButtons } from "./CrudComponents";
import { TextInput } from "../../components/FormInputs";
import LoadingSpinner from "../../components/LoadingSpinner";
import StandardButton from "../../components/Button";
import { useSearch } from "../../hooks";
import auth from "../../helpers/authHelpers.ts";

const formName = "participantForm";

const ParticipantRow = ({
  id,
  name,
  is_patreon: isPatreon = false,
  postUpsertParticipant,
  placeholder = "",
  openEdit,
  createCancel,
  showPatreonToggle = false,
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
        }}
      />
    </div>
  );
}
