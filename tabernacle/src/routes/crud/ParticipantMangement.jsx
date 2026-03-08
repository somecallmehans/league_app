import React, { useState, useMemo } from "react";
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

const PARTICIPANT_FORM_BASE = "participantForm";

const nameValidationRules = (isCreate) => ({
  required: isCreate ? "Name is required to create a participant." : false,
  minLength: { value: 2, message: "At least 2 characters." },
});

const displayNameValidationRules = {
  validate: (v) =>
    !v ||
    !String(v).trim() ||
    String(v).trim().length >= 2 ||
    "At least 2 characters.",
};

const inputClasses = (editing) =>
  `bg-transparent data-[focus]:outline-none w-full ${
    editing ? "text-sky-600" : ""
  }`;

const fieldConfig = (isCreate) => [
  {
    name: "participantName",
    placeholder: "Round name (lobby)",
    rules: nameValidationRules(isCreate),
  },
  {
    name: "participantDisplayName",
    placeholder: "Display name (public)",
    rules: displayNameValidationRules,
  },
];

function ParticipantRow({
  id,
  name,
  display_name,
  postUpsertParticipant,
  placeholder = "",
  openEdit,
  createCancel,
  onCreateSuccess,
}) {
  const [editing, setEditing] = useState(openEdit);
  const isCreate = id == null;
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleEdit = async (formData) => {
    const trimmedName = (formData.participantName ?? "").trim();
    const trimmedDisplayName = (formData.participantDisplayName ?? "").trim();
    const payload = { id };
    if (id) {
      if (trimmedName) payload.name = trimmedName;
      if (trimmedDisplayName) payload.display_name = trimmedDisplayName;
    } else {
      payload.name = trimmedName;
      if (trimmedDisplayName) payload.display_name = trimmedDisplayName;
    }
    await postUpsertParticipant(payload).unwrap();
    setEditing(false);
    if (isCreate) onCreateSuccess?.();
  };

  const handleDelete = async () => {
    await postUpsertParticipant({
      id,
      name: name ?? "",
      deleted: true,
    }).unwrap();
  };

  const formName = `${PARTICIPANT_FORM_BASE}-${id ?? "new"}`;
  const config = useMemo(() => fieldConfig(isCreate), [isCreate]);
  const nameValue = name ?? "";
  const displayNameValue = display_name ?? name ?? "";

  return (
    <form
      onSubmit={handleSubmit(handleEdit)}
      name={formName}
      className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center py-4 px-4 text-base md:text-lg border-b border-slate-200"
    >
      {config.map(
        ({ name: fieldName, placeholder: fieldPlaceholder, rules }) => (
          <div key={fieldName} className="min-w-0 flex flex-col gap-0.5">
            <TextInput
              name={fieldName}
              defaultValue={
                fieldName === "participantName" ? nameValue : displayNameValue
              }
              placeholder={placeholder || fieldPlaceholder}
              control={control}
              rules={rules}
              errors={errors}
              classes={inputClasses(editing)}
              disabled={!editing}
              type="text"
            />
          </div>
        ),
      )}
      <div className="flex items-center justify-end">
        <EditButtons
          editing={editing}
          setEditing={createCancel ?? setEditing}
          deleteAction={handleDelete}
          formName={formName}
        />
      </div>
    </form>
  );
}

function ParticipantListHeader() {
  return (
    <div
      className="grid grid-cols-[1fr_1fr_auto] gap-4 py-3 px-4 text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-300 bg-slate-50/80"
      role="row"
    >
      <span>Round name (lobby)</span>
      <span>Display name (public)</span>
      <span aria-hidden="true" />
    </div>
  );
}

export default function Page() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: participants, isLoading: participantsLoading } =
    useGetParticipantsQuery({ includeAdminParticipantFields: true });

  const [filteredData, RenderSearch, FilterList] = useSearch(
    participants ?? [],
    "Filter by name",
  );

  const [postUpsertParticipant] = usePostUpsertParticipantMutation();

  const sortedData = useMemo(
    () =>
      [...filteredData].sort((a, b) =>
        (a.display_name ?? a.name ?? "").localeCompare(
          b.display_name ?? b.name ?? "",
        ),
      ),
    [filteredData],
  );

  if (participantsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 min-h-0 flex flex-col">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <StandardButton
          title={showCreate ? "Cancel" : "New participant"}
          action={() => setShowCreate((prev) => !prev)}
        />
        <div className="flex-1 min-w-[200px]">{RenderSearch()}</div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 min-h-0">
        <ParticipantListHeader />

        {showCreate && (
          <ParticipantRow
            name=""
            display_name=""
            postUpsertParticipant={postUpsertParticipant}
            placeholder="Add participant name"
            createCancel={() => setShowCreate(false)}
            onCreateSuccess={() => setShowCreate(false)}
            openEdit
          />
        )}

        <FilterList
          data={sortedData}
          listKey="id"
          classes=""
          Component={ParticipantRow}
          componentProps={{ postUpsertParticipant }}
        />
      </div>

      {sortedData.length === 0 && !showCreate && (
        <p className="mt-4 text-slate-500 text-center">
          No participants found. Use the filter or create a new participant.
        </p>
      )}
    </div>
  );
}
