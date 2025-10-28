import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import { apiSlice, useGetParticipantBadgesQuery } from "../../api/apiSlice";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import { SimpleSelect } from "../crud/CrudComponents";

const AbbreviatedTypeFilter = ({ typeFilter, setTypeFilter }) => {
  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined)
  );

  return (
    <SimpleSelect
      placeholder="Type"
      options={(types ?? [])
        .filter(({ id }) => id !== 4)
        .map((t) => ({ label: t.name, value: t.id }))}
      value={
        typeFilter ? { label: typeFilter.label, value: typeFilter.value } : null
      }
      isClearable
      onChange={(obj) => setTypeFilter(obj || null)}
      classes="bg-white h-9 text-base [&>div]:h-9 [&>div]:min-h-0  md:w-1/3 text-gray-600 "
      menuPlacement="top"
    />
  );
};

const AchievementCard = ({ name, earned }) => (
  <article
    className={`relative border rounded-2xl shadow-sm  border-gray-300 p-4 min-h-[120px] flex items-center justify-center text-center
      ${earned ? "bg-yellow-100" : "bg-slate-100"}`}
  >
    <i
      className={`fa-solid fa-${earned ? "trophy" : "lock"} absolute top-3 left-3 text-lg ${
        earned ? "text-yellow-500" : "text-gray-400"
      }`}
    />
    <div
      className={`px-4 text-sm md:text-base font-medium leading-5 ${
        earned ? "text-gray-900" : "text-gray-700"
      }`}
    >
      {name}
    </div>
  </article>
);

export default function BadgesPage() {
  const { participant_id } = useParams();
  const dispatch = useDispatch();
  const navigation = useNavigate();
  const [typeFilter, setTypeFilter] = useState();
  const [statusFilter, setStatusFilter] = useState({
    label: "All",
    value: "all",
  });

  const { data: badges, isLoading: badgesLoading } =
    useGetParticipantBadgesQuery({ participant_id });

  useEffect(() => {
    dispatch(apiSlice.endpoints.getAchievementTypes.initiate(undefined));
  });

  const prefilterTotals = useMemo(() => {
    if (!badges) return {};

    return badges.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.type_id]: {
          earned: curr.achievements.filter((x) => x.earned).length,
          total: curr?.achievements?.length,
        },
      }),
      {}
    );
  });

  const filteredBuckets = useMemo(() => {
    if (!badges) return [];
    const byType = typeFilter
      ? badges.filter((b) => b.type_id === typeFilter.value)
      : badges;

    const matchStatus = (a) => {
      if (statusFilter.value === "all") return true;

      if (statusFilter.value === "earned" && a.earned) return true;
      else if (statusFilter.value === "unearned" && !a.earned) return true;
    };

    return byType
      .map((b) => ({
        ...b,
        achievements: b.achievements.filter(matchStatus),
      }))
      .filter((b) => b.achievements.length > 0);
  }, [badges, typeFilter, statusFilter]);

  const onBack = () => {
    const canGoBack = window.history.state?.idx > 0;
    if (canGoBack) navigation(-1);
    else navigation(fallback, { replace: true });
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex">
        <span>
          <button
            className="px-4 py-2 mr-2 rounded bg-sky-600 text-sm text-white"
            onClick={() => onBack()}
          >
            Back
          </button>
        </span>
        <PageTitle title="Earned Achievements" />
      </div>
      <div className="flex gap-2">
        <AbbreviatedTypeFilter
          setTypeFilter={setTypeFilter}
          typeFilter={typeFilter}
        />
        <SimpleSelect
          options={[
            { label: "All", value: "all" },
            { label: "Earned", value: "earned" },
            { label: "Unearned", value: "unearned" },
          ]}
          value={
            statusFilter
              ? { label: statusFilter.label, value: statusFilter.value }
              : null
          }
          onChange={(obj) => setStatusFilter(obj || null)}
          classes="bg-white h-9 text-base [&>div]:h-9 [&>div]:min-h-0  md:w-1/3 text-gray-600 "
          menuPlacement="top"
        />
      </div>
      {filteredBuckets.map((bucket) => {
        const earnedCount = bucket.achievements.filter((a) => a.earned).length;
        return (
          <section key={bucket.type_id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {bucket.type_name || "Untitled"}
              </h2>
              <span className="text-base text-gray-500">
                {prefilterTotals[bucket.type_id].earned}/
                {prefilterTotals[bucket.type_id].total} earned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
              {bucket.achievements.map((a) => (
                <AchievementCard key={a.id} {...a} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
