import React, { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetAchievementsListQuery,
  usePostUpsertAchievementsMutation,
  apiSlice,
} from "../../api/apiSlice";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Input } from "@headlessui/react";

import StandardButton from "../../components/Button";
import { useAchievementSearch } from "../../hooks";

import {
  TextInput,
  TextAreaField,
  Selector,
} from "../../components/FormInputs";
import LoadingSpinner from "../../components/LoadingSpinner";
import { associateParentsChildren } from "../../helpers/achievementHelpers";
import Drawer from "../../components/Drawer";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import { SimpleSelect } from "./CrudComponents";

const formName = "achievementForm";

const AchievementForm = ({
  id,
  name,
  point_value,
  children: achievementChildren,
  restrictions,
  type,
  setOpen,
}) => {
  const [postUpsertAchievements] = usePostUpsertAchievementsMutation();
  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined)
  );

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
      type: type || [],
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
          type_id: values.type.id,
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextInput
            name="point_value"
            title="Points"
            type="number"
            control={control}
            register={{ ...register("point_value") }}
            classes="text-sm w-full sm:flex-1 border rounded-lg p-2 mb-2 sm:mb-0"
            placeholder="Point Value"
            rules={{
              validate: (value) =>
                +value < 0 ? "Point value must be 0 or greater" : undefined,
            }}
            errors={errors}
            containerClasses="basis-1/2"
          />
          <Selector
            name="type"
            title="Type"
            options={types}
            control={control}
            placeholder="Achievement Type"
            classes="text-sm w-full sm:flex-1 mb-2 sm:mb-0"
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => option.id}
            containerClasses="basis-1/2"
          />
        </div>
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
  const { name, point_value, slug, type } = props;
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [postUpsertAchievements] = usePostUpsertAchievementsMutation();
  const hex_code = type?.hex_code;

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="relative bg-white rounded border border-solid p-3 pl-4 shadow-md hover:border-sky-400 md:min-h-24"
      >
        <div className="flex justify-between gap-2 text-sm text-gray-500 mb-1">
          <span>
            {point_value} Point{point_value === 1 ? "" : "s"}
          </span>
          {type?.name && (
            <span
              className="text-xs font-medium truncate"
              style={{ color: hex_code || undefined }}
            >
              {type.name}
            </span>
          )}
        </div>
        <div className="line-clamp-2">{name}</div>
        {hex_code && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l"
            style={{ backgroundColor: hex_code, opacity: "60%" }}
          />
        )}
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
  const dispatch = useDispatch();
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState();

  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined),
  );

  useEffect(() => {
    dispatch(apiSlice.endpoints.getAchievementTypes.initiate(undefined));
  }, [dispatch]);

  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievementsListQuery();

  const achievementLookup = useMemo(() => {
    if (!achievements) return {};

    return achievements.reduce((acc, achievement) => {
      acc[achievement.id] = achievement;
      return acc;
    }, {});
  }, [achievements]);

  const { filteredData, setSearchTerm } = useAchievementSearch(
    achievements,
    achievementLookup,
    typeFilter,
    null,
  );

  const groupedAchievements = useMemo(() => {
    if (!filteredData?.length) return [];

    const associated = associateParentsChildren(filteredData);
    const groups = {};
    for (const achievement of associated) {
      const points = achievement.point_value ?? 0;
      if (!groups[points]) {
        groups[points] = [];
      }
      groups[points].push(achievement);
    }
    return groups;
  }, [filteredData]);

  const sortedPointKeys = useMemo(
    () =>
      Object.keys(groupedAchievements).sort(
        (a, b) => Number(b) - Number(a),
      ),
    [groupedAchievements],
  );

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
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <SimpleSelect
          placeholder="Type"
          options={(types ?? []).map((t) => ({ label: t.name, value: t.id }))}
          value={
            typeFilter
              ? { label: typeFilter.label, value: typeFilter.value }
              : null
          }
          isClearable
          onChange={(obj) => setTypeFilter(obj || null)}
          classes="bg-white h-9 text-base [&>div]:h-9 [&>div]:min-h-0 md:w-1/3 text-gray-600"
          menuPlacement="bottom"
        />
        <Input
          placeholder="Filter by name"
          className="text-gray-600 bg-white py-1.5 grow px-2 rounded border border-zinc-300 h-9"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {sortedPointKeys.length === 0 ? (
        <p className="text-sm text-gray-600">No achievements match your filters.</p>
      ) : (
        sortedPointKeys.map((key) => (
          <div key={key} className="my-4">
            <div className="grid md:grid-cols-4 gap-4">
              {groupedAchievements[key].map((achievement) => (
                <AchievementCard key={achievement.id} {...achievement} />
              ))}
            </div>
            <hr className="h-px my-8 bg-gray-300 border-0"></hr>
          </div>
        ))
      )}
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
