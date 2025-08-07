import React, { useState, useMemo } from "react";
import {
  useGetAchievementsListQuery,
  usePostUpsertAchievementsMutation,
} from "../../api/apiSlice";
import { useForm, useFieldArray, useWatch } from "react-hook-form";

import StandardButton from "../../components/Button";
import { TextInput, TextAreaField } from "../../components/FormInputs";
import LoadingSpinner from "../../components/LoadingSpinner";
import { associateParentsChildren } from "../achievements/Achievements";
import Drawer from "../../components/Drawer";
import ConfirmModal from "../../components/Modals/ConfirmModal";

const formName = "achievementForm";

const AchievementForm = ({
  id,
  name,
  point_value,
  children: achievementChildren,
  restrictions,
  setOpen,
}) => {
  const [postUpsertAchievements] = usePostUpsertAchievementsMutation();
  const {
    control,
    register,
    handleSubmit,
    formState: { isDirty, errors },
  } = useForm({
    defaultValues: {
      name: name || "",
      point_value: point_value || "",
      restrictions: restrictions || [],
      achievements: achievementChildren || [],
    },
  });

  const {
    fields: restrictionFields,
    append: appendRestriction,
    update: updateRestriction,
  } = useFieldArray({
    control,
    name: "restrictions",
  });

  const watchedRestrictions = useWatch({
    control,
    name: "restrictions",
  });

  const {
    fields: achievementFields,
    append: appendAchievement,
    update: updateAchievement,
  } = useFieldArray({
    control,
    name: "achievements",
  });

  const watchedAchievements = useWatch({
    control,
    name: "achievements",
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        setOpen(false);
        const cleaned = {
          ...values,
          restrictions: values.restrictions?.filter(
            (r) => !r.deleted || r.id != null
          ),
          achievements: values.achievements?.filter(
            (a) => !a.deleted || a.id != null
          ),
        };
        postUpsertAchievements({ id, ...cleaned });
      })}
      name={`${formName}_${id}`}
    >
      <div className="flex flex-col p-4">
        <TextAreaField
          name="name"
          title="Name"
          control={control}
          register={{ ...register("name") }}
          classes="text-sm grow  border rounded-lg p-2 mb-2 resize-none"
          placeholder="Name"
          rows={2}
          rules={{
            validate: (value) => (!value ? "Name is required" : undefined),
          }}
          errors={errors}
        />
        <TextInput
          name="point_value"
          title="Points"
          type="number"
          control={control}
          register={{ ...register("point_value") }}
          classes="text-sm grow  border rounded-lg p-2  mb-2"
          placeholder="Point Value"
          rules={{
            validate: (value) =>
              +value < 0 ? "Point value must be 0 or greater" : undefined,
          }}
          errors={errors}
        />
        <label className="font-bold text-lg">Info</label>
        <div className="flex flex-col  mb-2">
          {restrictionFields.map((field, index) => {
            const isDeleted = watchedRestrictions?.[index]?.deleted;

            if (isDeleted) return null;
            return (
              <div key={field.id} className="flex gap-2">
                <div className="flex flex-col grow  bg-white border">
                  <TextAreaField
                    name={`restrictions[${index}].name`}
                    control={control}
                    register={register(`restrictions.${index}.name`)}
                    placeholder="Add information"
                    classes="p-2 text-sm border-b"
                    rows={3}
                  />
                  <TextInput
                    name={`restrictions[${index}].url`}
                    control={control}
                    register={register(`restrictions.${index}.url`)}
                    placeholder="URL (optional)"
                    classes="p-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateRestriction(index, {
                      ...watchedRestrictions[index],
                      deleted: true,
                    })
                  }
                  className="text-red-500 hover:text-red-300"
                >
                  <i className="fa fa-trash" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => appendRestriction({ name: "", url: "" })}
            className="text-sm text-blue-600 mt-1 text-left"
          >
            Add New
          </button>
        </div>
        <label className="font-bold text-lg">Children</label>
        <div
          className={`flex flex-col rounded-lg ${
            achievementFields.length ? "border" : ""
          }`}
        >
          {achievementFields.map((field, index) => {
            const isDeleted = watchedAchievements?.[index]?.deleted;

            if (isDeleted) return null;
            return (
              <div
                key={field.id}
                className="flex bg-white items-center text-xs md:text-sm border-b pr-2"
              >
                <TextAreaField
                  name={`achievements[${index}].name`}
                  type="text"
                  control={control}
                  register={register(`achievements.${index}.name`)}
                  placeholder="Achievement Name"
                  classes="flex-1 p-2 resize-none text-xs md:text-sm"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateAchievement(index, {
                      ...watchedAchievements[index],
                      deleted: true,
                    })
                  }
                  className="text-red-500 hover:text-red-300 ml-2"
                >
                  <i className="fa fa-trash" />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => appendAchievement({ name: "" })}
          className="text-sm text-blue-600 text-left"
        >
          Add New
        </button>
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

const AchievementCard = (props) => {
  const { name, point_value, slug } = props;
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [postUpsertAchievements] = usePostUpsertAchievementsMutation();
  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="bg-white rounded border border-solid p-3 shadow-md hover:border-sky-400 md:min-h-24"
      >
        <div className="text-sm text-gray-500">
          {point_value} Point{point_value === 1 ? "" : "s"}
        </div>
        <div className="line-clamp-2">{name}</div>
      </div>
      <ConfirmModal
        isOpen={showModal}
        title={`Delete ${name}?`}
        confirmAction={() => {
          setShowModal(false);
          setOpen(false);
          postUpsertAchievements({ ...props, deleted: true });
        }}
        closeModal={() => setShowModal(!setShowModal)}
        bodyText={
          <span className="text-red-500 text-sm">
            This is a destructive action. Confirming will also delete any child
            achievements and notes associated with this achievement
          </span>
        }
      />
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title={
          <span>
            Edit Achievement{" "}
            {!slug && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-red-500 hover:text-red-300 ml-1"
              >
                <i className="fa fa-trash" />
              </button>
            )}
          </span>
        }
      >
        <AchievementForm {...props} setOpen={setOpen} />
      </Drawer>
    </>
  );
};

export default function Page() {
  const [showCreate, setShowCreate] = useState(false);
  // TODO: Add search/filtering

  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsListQuery();

  const groupedAchievements = useMemo(() => {
    if (!achievements) return [];

    const associated = associateParentsChildren(achievements);
    const groups = {};
    for (const achievement of associated) {
      const points = achievement.point_value ?? 0;
      if (!groups[points]) {
        groups[points] = [];
      }
      groups[points].push(achievement);
    }
    return groups;
  }, [achievements]);

  if (achievementsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      <div className="mb-2">
        <div className="text-sm text-gray-500 italic md:w-3/4 mb-1">
          Achievements below are grouped by point value. You may click an
          achievement to edit any of its attributes, or click create to make a
          new one.
        </div>

        <StandardButton
          title={showCreate ? "Cancel" : "Create"}
          action={() => setShowCreate(!showCreate)}
        />
      </div>
      {Object.keys(groupedAchievements).map((key) => (
        <div key={key} className="my-4">
          <div className="grid md:grid-cols-4 gap-4">
            {groupedAchievements[key].map((achievement) => (
              <AchievementCard key={achievement.id} {...achievement} />
            ))}
          </div>
          <hr className="h-px my-8 bg-gray-300 border-0"></hr>
        </div>
      ))}
      <Drawer
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Achievement"
      >
        <AchievementForm setOpen={setShowCreate} />
      </Drawer>
    </div>
  );
}
