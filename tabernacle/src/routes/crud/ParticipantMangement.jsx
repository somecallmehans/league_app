import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useGetParticipantsQuery,
  usePostUpsertParticipantMutation,
} from "../../api/apiSlice";
import { EditButtons } from "./CrudComponents.jsx";
import { TextInput } from "../../components/FormInputs.jsx";
import LoadingSpinner from "../../components/LoadingSpinner";
import StandardButton from "../../components/Button";

const formName = "participantForm";

const ParticipantRow = ({
  id,
  name,
  postUpsertParticipant,
  placeholder = "",
  openEdit,
  createCancel,
}) => {
  const [editing, setEditing] = useState(openEdit);
  const { control, register, handleSubmit } = useForm();

  const handleEdit = async (formData) => {
    const { participantName } = formData;
    await postUpsertParticipant({ id: id, name: participantName }).unwrap();
    setEditing(false);
  };

  // This will do for now but there needs to be a prompty to prevent accidental deletions
  const handleDelete = async () => {
    await postUpsertParticipant({
      id: id,
      name: name,
      deleted: true,
    }).unwrap();
  };

  return (
    <form
      onSubmit={handleSubmit(handleEdit)}
      name={formName}
      className="flex justify-between mb-2 px-4 text-lg border-b border-slate-400"
    >
      <TextInput
        name="participantName"
        defaultValue={name}
        placeholder={placeholder}
        control={control}
        classes={`bg-transparent data-[focus]:outline-none ${
          editing ? "text-sky-600" : ""
        }`}
        disabled={!editing}
        register={{ ...register("participantName") }}
        type="text"
      />
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
  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery();

  const [postUpsertParticipant] = usePostUpsertParticipantMutation();

  if (participantsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      <div className="mb-2">
        <StandardButton
          title={showCreate ? "Cancel Create" : "Create New"}
          action={() => setShowCreate(!showCreate)}
        />
      </div>
      {showCreate && (
        <div className="px-64">
          <ParticipantRow
            name=""
            postUpsertParticipant={postUpsertParticipant}
            placeholder="Add Participant Name"
            createCancel={() => setShowCreate(false)}
            openEdit
          />
        </div>
      )}
      {participants.map(({ id, name }) => (
        <div key={id} className="px-64">
          <ParticipantRow
            id={id}
            name={name}
            postUpsertParticipant={postUpsertParticipant}
          />
        </div>
      ))}
    </div>
  );
}
