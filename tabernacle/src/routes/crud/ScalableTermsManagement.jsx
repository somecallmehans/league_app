import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  useGetScalableTermsQuery,
  useGetScalableTermTypesQuery,
  useUpsertScalableTermMutation,
  useCreateScalableTermTypeMutation,
} from "../../api/apiSlice";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import StandardButton from "../../components/Button";
import {
  TextInput,
  TextAreaField,
  Selector,
} from "../../components/FormInputs";
import LoadingSpinner from "../../components/LoadingSpinner";
import Drawer from "../../components/Drawer";
import ConfirmModal from "../../components/Modals/ConfirmModal";

const buildInfoPayload = (entries) =>
  entries
    ?.filter((entry) => !entry.deleted || entry.id != null)
    ?.map((entry) => {
      if (entry.deleted && entry.id) {
        return { id: entry.id, deleted: true };
      }
      if (entry.id) {
        return { id: entry.id, info: entry.info };
      }
      if (entry.info?.trim()) {
        return { info: entry.info.trim() };
      }
      return null;
    })
    .filter(Boolean);

const TermForm = ({ term, setOpen, onSuccess }) => {
  const [upsertTerm] = useUpsertScalableTermMutation();
  const { data: types } = useGetScalableTermTypesQuery();
  const {
    control,
    register,
    handleSubmit,
    formState: { isDirty, errors },
    reset,
  } = useForm({
    defaultValues: {
      term_display: term?.term_display ?? "",
      type: null,
      info: term?.info ?? [],
    },
  });

  const {
    fields: infoFields,
    append: appendInfo,
    update: updateInfo,
  } = useFieldArray({
    control,
    name: "info",
  });

  const watchedInfo = useWatch({
    control,
    name: "info",
  });

  useEffect(() => {
    if (!types) return;

    const typeOpt = term?.type_id
      ? (types.find((t) => t.id === term.type_id) ?? null)
      : null;

    reset({
      term_display: term?.term_display ?? "",
      type: typeOpt,
      info: term?.info ?? [],
    });
  }, [types, term, reset]);

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const type_id = values.type?.id ?? null;
        const info = buildInfoPayload(values.info);
        const payload = {
          id: term?.id,
          term_display: values.term_display,
          type_id,
        };
        if (info?.length) {
          payload.info = info;
        }

        try {
          await upsertTerm(payload).unwrap();
          setOpen(false);
          onSuccess?.();
        } catch (err) {
          toast.error(
            err?.data?.message ?? err?.data?.detail ?? "Failed to save term",
          );
        }
      })}
    >
      <div className="flex flex-col p-4 gap-4">
        <TextInput
          name="term_display"
          title="Term"
          control={control}
          register={register("term_display")}
          classes="text-sm border rounded-lg p-2"
          placeholder="e.g. Trample, 3"
          rules={{
            validate: (v) => (!v?.trim() ? "Term is required" : undefined),
          }}
          errors={errors}
        />
        <Selector
          name="type"
          title="Type"
          options={types ?? []}
          control={control}
          placeholder="Select type"
          classes="text-sm border rounded-lg"
          getOptionLabel={(o) => o.name}
          getOptionValue={(o) => String(o.id)}
          rules={{
            validate: (v) => (!v ? "Type is required" : undefined),
          }}
        />
        <div>
          <label className="font-bold text-lg">Info</label>
          <div className="flex flex-col mb-2">
            {infoFields.map((field, index) => {
              const isDeleted = watchedInfo?.[index]?.deleted;
              if (isDeleted) return null;

              return (
                <div key={field.id} className="flex gap-2 mt-2">
                  <TextAreaField
                    name={`info[${index}].info`}
                    control={control}
                    register={register(`info.${index}.info`)}
                    placeholder="Add scalable info"
                    classes="p-2 text-sm border rounded-lg grow bg-white"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateInfo(index, {
                        ...watchedInfo[index],
                        deleted: true,
                      })
                    }
                    className="text-red-500 hover:text-red-300 self-start pt-2"
                  >
                    <i className="fa fa-trash" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => appendInfo({ info: "" })}
              className="text-sm text-blue-600 mt-1 text-left"
            >
              Add New
            </button>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 z-10">
        <button
          disabled={!isDirty}
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Save
        </button>
      </div>
    </form>
  );
};

const CreateTypeForm = ({ setOpen, onSuccess }) => {
  const [createType] = useCreateScalableTermTypeMutation();
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createType({ name: trimmed }).unwrap();
      setOpen(false);
      setName("");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.detail ?? "Failed to create type");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <label className="font-bold text-lg block mb-2">Type name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Keyword Ability"
        className="w-full border rounded-lg p-2 text-sm"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Create
      </button>
    </form>
  );
};

const TermCard = ({ term, typeName, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [upsertTerm] = useUpsertScalableTermMutation();

  const handleDelete = async () => {
    try {
      await upsertTerm({
        id: term.id,
        term_display: term.term_display,
        deleted: true,
      }).unwrap();
      setShowModal(false);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.detail ?? "Failed to delete term");
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded border border-solid p-3 shadow-md hover:border-sky-400 cursor-pointer relative"
      >
        <div className="text-sm text-gray-500">
          {typeName || "Uncategorized"}
        </div>
        <div>{term.term_display}</div>
        {(term.info?.length ?? 0) > 0 && (
          <div className="absolute top-2 right-2 text-sky-400">
            <i className="fa-solid fa-circle-info text-xs" />
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={showModal}
        title={`Delete "${term.term_display}"?`}
        confirmAction={handleDelete}
        closeModal={() => setShowModal(false)}
        bodyText={
          <span className="text-red-500 text-sm">
            This will soft-delete the term. It will no longer appear in
            scorecards or the browse page.
          </span>
        }
      />
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title={
          <span>
            Edit Term
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-red-500 hover:text-red-300 ml-2"
            >
              <i className="fa fa-trash" />
            </button>
          </span>
        }
      >
        {open && (
          <TermForm
            key={term.id}
            term={term}
            setOpen={setOpen}
            onSuccess={onSuccess}
          />
        )}
      </Drawer>
    </>
  );
};

export default function ScalableTermsManagement() {
  const { data, isLoading, refetch } = useGetScalableTermsQuery();
  useGetScalableTermTypesQuery();
  const [showCreateTerm, setShowCreateTerm] = useState(false);
  const [showCreateType, setShowCreateType] = useState(false);

  const onSuccess = () => refetch();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const types = data?.types ?? [];

  return (
    <div className="p-4">
      <div className="text-sm text-gray-500 italic md:w-3/4 mb-4">
        Manage scalable terms. New terms are automatically added to all scalable
        achievements. Deletes are soft-deletes.
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <StandardButton
          title={showCreateTerm ? "Cancel" : "Add Term"}
          action={() => setShowCreateTerm(!showCreateTerm)}
        />
        <StandardButton
          title={showCreateType ? "Cancel" : "Add Type"}
          action={() => setShowCreateType(!showCreateType)}
        />
      </div>

      <div className="space-y-6">
        {types.map((typeGroup) => (
          <div key={typeGroup.name}>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {typeGroup.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {typeGroup.terms.map((term) => (
                <TermCard
                  key={term.id}
                  term={term}
                  typeName={typeGroup.name}
                  onSuccess={onSuccess}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Drawer
        isOpen={showCreateTerm}
        onClose={() => setShowCreateTerm(false)}
        title="New Scalable Term"
      >
        {showCreateTerm && (
          <TermForm
            key="new"
            term={null}
            setOpen={setShowCreateTerm}
            onSuccess={onSuccess}
          />
        )}
      </Drawer>

      <Drawer
        isOpen={showCreateType}
        onClose={() => setShowCreateType(false)}
        title="New Scalable Term Type"
      >
        <CreateTypeForm setOpen={setShowCreateType} onSuccess={onSuccess} />
      </Drawer>
    </div>
  );
}
