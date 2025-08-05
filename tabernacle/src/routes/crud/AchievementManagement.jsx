import React, { useState, useMemo } from "react";
import {
  useGetAchievementsQuery,
  usePostUpsertAchievementsMutation,
} from "../../api/apiSlice";
import { useForm, useFieldArray } from "react-hook-form";

import StandardButton from "../../components/Button";
import { TextInput, TextAreaField } from "../../components/FormInputs";
import { EditButtons } from "./CrudComponents";
import LoadingSpinner from "../../components/LoadingSpinner";
import { associateParentsChildren } from "../achievements/Achievements";
import Drawer from "../../components/Drawer";

const formName = "achievementForm";

const chopName = (name) =>
  name.length > 50 ? `${name.substring(0, 50)}...` : name;

const AchievementRow = ({
  id,
  name = "",
  point_value = "",
  classes,
  placeholder = "",
  postUpsertAchievements,
  parent_id,
  achievementChildren = [],
  openEdit,
  disableDelete,
}) => {
  const [editing, setEditing] = useState(openEdit);
  const [createChild, setCreateChild] = useState();

  const { control, register, handleSubmit } = useForm();

  const handleEdit = async (formData) => {
    const { achievementName, achievementPointValue } = formData;
    await postUpsertAchievements({
      id: id,
      name: achievementName || name,
      point_value: achievementPointValue || point_value,
      parent_id: parent_id,
    }).unwrap();
    setEditing(false);
    setCreateChild(false);
  };

  const handleDelete = async () => {
    if (disableDelete) {
      return;
    }

    await postUpsertAchievements({
      id: id,
      name: name,
      point_value: point_value,
      parent_id: parent_id,
      deleted: true,
    });
  };

  return (
    <React.Fragment>
      <form
        onSubmit={handleSubmit(handleEdit)}
        name={formName}
        className={`${classes} flex gap-2 justify-between mb-2 px-2 text-lg border-b border-slate-400`}
      >
        <TextInput
          name="achievementName"
          type="text"
          control={control}
          register={{ ...register("achievementName") }}
          defaultValue={name || ""}
          classes={`text-sm grow bg-transparent data-[focus]:outline-none ${
            editing ? "text-sky-600" : ""
          }`}
          placeholder={placeholder}
          disabled={!editing}
        />
        <TextInput
          name="achievementPointValue"
          type="number"
          control={control}
          register={{ ...register("achievementPointValue") }}
          defaultValue={point_value || ""}
          classes={`max-w-10 bg-transparent data-[focus]:outline-none ${
            editing ? "text-sky-600" : ""
          }`}
          disabled={!editing}
        />
        {!parent_id ? (
          <div>
            <i
              onClick={() => setCreateChild(!createChild)}
              className={`fa-solid fa-${
                createChild ? "x" : "plus"
              }  ml-2 text-slate-500 hover:text-sky-400`}
            />
          </div>
        ) : (
          <div />
        )}
        <EditButtons
          editing={editing}
          setEditing={setEditing}
          deleteAction={handleDelete}
          formName={formName}
          disableDelete={disableDelete}
        />
      </form>
      {createChild && (
        <AchievementRow
          name=""
          point_value=""
          classes="ml-4"
          postUpsertAchievements={postUpsertAchievements}
          parent_id={id}
          placeholder="Achievement Name"
          openEdit
        />
      )}
      {achievementChildren.length > 0 &&
        achievementChildren.map(
          ({
            id: childId,
            name: childName,
            point_value: childPointValue,
            parent_id,
          }) => (
            <AchievementRow
              key={childId}
              id={childId}
              name={childName}
              point_value={childPointValue}
              classes="ml-4"
              postUpsertAchievements={postUpsertAchievements}
              parent_id={parent_id}
            />
          )
        )}
    </React.Fragment>
  );
};

const AchievementForm = ({
  id,
  name,
  point_value,
  children: achievementChildren,
  restrictions,
}) => {
  const { control, register, handleSubmit } = useForm({
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
    remove: removeRestriction,
  } = useFieldArray({
    control,
    name: "restrictions",
  });

  const {
    fields: achievementFields,
    append: appendAchievement,
    remove: removeAchievement,
  } = useFieldArray({
    control,
    name: "achievements",
  });

  return (
    <form
      onSubmit={handleSubmit((values) => console.log(values))}
      name={`${formName}_${id}`}
    >
      <div className="flex flex-col p-4">
        <label className="font-bold text-lg">Name</label>
        <TextAreaField
          name="name"
          control={control}
          register={{ ...register("name") }}
          classes="text-sm grow  border rounded-lg p-2 mb-2"
          placeholder="Name"
          rows={2}
        />
        <label className="font-bold text-lg">Points</label>
        <TextInput
          name="point_value"
          type="number"
          control={control}
          register={{ ...register("point_value") }}
          classes="text-sm grow  border rounded-lg p-2  mb-2"
          placeholder="Point Value"
        />
        <label className="font-bold text-lg">Info</label>
        <div className="flex flex-col  mb-2">
          {restrictionFields.map((field, index) => (
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
                onClick={() => removeRestriction(index)}
                className="text-red-500"
              >
                <i className="fa fa-trash" />
              </button>
            </div>
          ))}
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
          {achievementFields.map((field, index) => (
            <div
              key={field.id}
              className="flex bg-white items-center text-sm border-b pr-2"
            >
              <TextInput
                name={`achievements[${index}].name`}
                type="text"
                control={control}
                register={register(`achievements.${index}.name`)}
                placeholder="Achievement Name"
                classes="flex-1 p-2"
              />
              <button
                type="button"
                onClick={() => removeAchievement(index)}
                className="text-red-500 ml-2"
              >
                <i className="fa fa-trash" />
              </button>
            </div>
          ))}
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
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

const AchievementCard = (props) => {
  const { name, point_value } = props;
  console.log(props);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="bg-white rounded border border-solid p-3 shadow-md"
      >
        <div className="text-sm text-gray-500">
          {point_value} Point{point_value === 1 ? "" : "s"}
        </div>
        {chopName(name)}
      </div>
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title={name ? "Edit Achievement" : "New Achievement"}
      >
        <AchievementForm {...props} />
      </Drawer>
    </>
  );
};

export default function Page() {
  const [showCreate, setShowCreate] = useState();

  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsQuery();

  const [postUpsertAchievements] = usePostUpsertAchievementsMutation();

  if (achievementsLoading) {
    return <LoadingSpinner />;
  }

  const { data } = achievements;

  const associated = useMemo(() => {
    if (!data) return [];

    return associateParentsChildren(data);
  }, [data]);

  return (
    <div className="p-4">
      <div className="mb-2">
        <StandardButton
          title={showCreate ? "Cancel Create" : "Create New"}
          action={() => setShowCreate(!showCreate)}
        />
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {associated.map((achievement) => (
          <AchievementCard key={achievement.id} {...achievement} />
        ))}
      </div>
      {/* {showCreate && (
        <AchievementRow
          name=""
          point_value=""
          postUpsertAchievements={postUpsertAchievements}
          placeholder="Achievement Name"
          openEdit
        />
      )}
      {Object.keys(achievements?.map).map((x) => {
        const achievementsData = achievements?.map[x];
        return achievementsData.map(
          ({
            id,
            name,
            children: achievementChildren,
            point_value,
            ...data
          }) => (
            <AchievementRow
              key={id}
              id={id}
              postUpsertAchievements={postUpsertAchievements}
              name={name}
              point_value={point_value}
              achievementChildren={achievementChildren}
              disableDelete={!!data?.slug}
            />
          )
        );
      })} */}
    </div>
  );
}
