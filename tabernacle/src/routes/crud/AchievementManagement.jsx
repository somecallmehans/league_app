import React, { useState, useMemo } from "react";
import {
  useGetAchievementsQuery,
  usePostUpsertAchievementsMutation,
} from "../../api/apiSlice";
import { useForm } from "react-hook-form";

import StandardButton from "../../components/Button";
import { TextInput } from "../../components/FormInputs";
import { EditButtons } from "./CrudComponents";
import LoadingSpinner from "../../components/LoadingSpinner";
import { associateParentsChildren } from "../achievements/Achievements";

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

const AchievementCard = ({ name, point_value }) => {
  return (
    <div className="bg-white rounded border border-solid p-3 shadow-md">
      <div className="text-sm text-gray-400">
        {point_value} Point{point_value === 1 ? "" : "s"}
      </div>
      {chopName(name)}
    </div>
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
