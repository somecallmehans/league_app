import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useGetAchievementsQuery,
  useGetAllSessionsQuery,
  useGetAchievementsForSessionQuery,
  usePostUpsertEarnedMutation,
  useGetSessionByDateQuery,
} from "../../api/apiSlice";

import LoadingSpinner from "../../components/LoadingSpinner";
import { Selector } from "../../components/FormInputs";
import { EditButtons, SimpleSelect, HelpfulWrapper } from "./CrudComponents";
import { formatDateString } from "../../helpers/dateHelpers";

const DisplayCol = ({ title, value }) => (
  <div className="flex flex-col items-center">
    <span className="text-xs">{title}</span>
    <span>{value || 0}</span>
  </div>
);

const EditAchievement = ({
  id = "",
  participantId,
  name = "",
  allAchievements,
  earned_id = "",
  postUpsertEarned,
  openEdit,
  formName,
  sessionId,
  setToggleCreate,
  sessionRounds,
  earned_points,
  round,
}) => {
  const [editing, setEditing] = useState(openEdit);
  const { control, register, handleSubmit } = useForm();

  const handleCreate = async (formData) => {
    const {
      participantAchievement: { id: achievementId },
      round: { id: roundId },
    } = formData;
    await postUpsertEarned({
      round: roundId,
      achievement: achievementId,
      session: sessionId,
      participant: participantId,
    }).unwrap();
    setToggleCreate(false);
  };

  const handleOnChangeEdit = async (data) => {
    const { id: achievementId } = data;
    await postUpsertEarned({
      earned_id: earned_id,
      achievement: achievementId,
    }).unwrap();
  };

  const handleOnChangeDelete = async () => {
    await postUpsertEarned({
      earned_id: earned_id,
      deleted: true,
    }).unwrap();
  };

  return (
    <form
      onSubmit={handleSubmit(handleCreate)}
      name={formName}
      className="px-4 py-2 flex gap-4 justify-between items-center mb-2 text-lg border-b border-slate-300"
    >
      <Selector
        name="participantAchievement"
        control={control}
        defaultValue={{ name: name, id: id }}
        options={allAchievements.data}
        classes="basis-2/3"
        onChange={openEdit ? undefined : handleOnChangeEdit}
        disabled={!editing}
        register={{ ...register("participantAchievement") }}
        getOptionLabel={(option) => option?.name}
        getOptionValue={(option) => option?.id}
      />
      <Selector
        name="round"
        placeholder="Rd"
        control={control}
        defaultValue={{
          round_number: round?.round_number,
          id: round?.id,
        }}
        options={sessionRounds}
        onChange={openEdit ? undefined : handleOnChangeEdit}
        disabled={!editing}
        register={{ ...register("round") }}
        getOptionLabel={(option) => option?.round_number}
        getOptionValue={(option) => option?.id}
      />
      <DisplayCol title="Points" value={earned_points || 0} />
      <EditButtons
        formName={formName}
        editing={editing}
        setEditing={setEditing}
        deleteAction={handleOnChangeDelete}
      />
    </form>
  );
};

const EarnedRow = ({
  participantId,
  name,
  totalPoints,
  achievements,
  allAchievements,
  postUpsertEarned,
  sessionId,
  sessionRounds,
  session_points,
}) => {
  const [toggle, showToggle] = useState();
  const [toggleCreate, setToggleCreate] = useState();

  return (
    <React.Fragment>
      <div className="flex justify-between mb-2 px-4 text-lg border-b border-slate-400">
        <div className="flex gap-12 basis-3/4 justify-between">
          {name}
          <div className="flex gap-4">
            <span className="font-bold">{session_points} </span>
            Points/Session
            <span className="font-bold">{totalPoints}</span> Points/Month
          </div>
        </div>
        <div>
          {achievements.length > 0 && (
            <i
              className={` mr-4 fa fa-caret-${toggle ? "down" : "left"}`}
              onClick={() => showToggle(!toggle)}
            />
          )}
          <i
            className={`fa fa-${toggleCreate ? "x" : "plus"}`}
            onClick={() => setToggleCreate(!toggleCreate)}
          />
        </div>
      </div>
      {toggleCreate && (
        <EditAchievement
          allAchievements={allAchievements}
          postUpsertEarned={postUpsertEarned}
          openEdit
          formName="createAchievement"
          participantId={participantId}
          sessionId={sessionId}
          setToggleCreate={setToggleCreate}
          sessionRounds={sessionRounds}
        />
      )}
      {toggle &&
        achievements.map((achievement) => (
          <EditAchievement
            {...achievement}
            key={achievement?.earned_id}
            allAchievements={allAchievements}
            postUpsertEarned={postUpsertEarned}
            formName="editAchievement"
            sessionRounds={sessionRounds}
          />
        ))}
    </React.Fragment>
  );
};

const helpfulMessage = (month, sessions) => {
  if (!month) {
    return "Please choose a session month and date to begin";
  }
  if (sessions === 0) {
    return "This session does not have any information associated";
  }
  return "";
};

export default function Page() {
  const [selectMonth, setSelectMonth] = useState();
  const [selectSession, setSelectSession] = useState();

  const { data: allAchievements, isLoading: achievementsLoading } =
    useGetAchievementsQuery();
  const { data: allSessions, isLoading: sessionsLoading } =
    useGetAllSessionsQuery();

  const { data: currentOpenSession, isLoading: currentSessionLoading } =
    useGetSessionByDateQuery(selectMonth, {
      skip: !selectSession || !selectMonth,
    });

  const { data: earnedData, isLoading: earnedLoading } =
    useGetAchievementsForSessionQuery(selectSession, {
      skip: !selectSession,
    });

  const [postUpsertEarned] = usePostUpsertEarnedMutation();

  if (
    earnedLoading ||
    achievementsLoading ||
    sessionsLoading ||
    currentSessionLoading
  ) {
    return <LoadingSpinner />;
  }

  const MM_YY = Object.keys(allSessions)?.map((x) => ({ label: x, value: x }));
  const sessionDates =
    selectMonth &&
    allSessions[selectMonth]?.map(({ id, created_at }) => ({
      label: formatDateString(created_at),
      value: id,
    }));
  const sessionMap = sessionDates?.reduce(
    (acc, curr) => ({ ...acc, [curr.value]: curr }),
    {}
  );

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-2">
        <SimpleSelect
          placeholder="Select Month"
          options={MM_YY}
          classes="basis-1/4"
          onChange={(obj) => {
            setSelectMonth(obj.value);
            setSelectSession(undefined);
          }}
          value={{ label: selectMonth, value: selectMonth }}
        />
        <SimpleSelect
          key={`${selectSession}-key`}
          placeholder="Select Session"
          options={sessionDates}
          onChange={(obj) => {
            setSelectSession(obj.value);
          }}
          classes="basis-1/4"
          value={{
            label: selectSession && sessionMap[selectSession]?.label,
            value: selectSession && sessionMap[selectSession]?.value,
          }}
        />
      </div>
      <HelpfulWrapper
        hasData={!!earnedData?.length}
        message={helpfulMessage(selectMonth, sessionDates?.length)}
      >
        {earnedData?.map(
          ({ id, name, total_points, session_points, achievements }) => (
            <div key={id} className="px-8">
              <EarnedRow
                participantId={id}
                sessionId={selectSession}
                sessionRounds={currentOpenSession?.rounds}
                name={name}
                totalPoints={total_points}
                achievements={achievements}
                allAchievements={allAchievements}
                postUpsertEarned={postUpsertEarned}
                selectMonth={selectMonth}
                session_points={session_points}
              />
            </div>
          )
        )}
      </HelpfulWrapper>
    </div>
  );
}
