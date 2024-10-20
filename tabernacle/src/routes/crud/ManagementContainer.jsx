import React from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import PageTitle from "../../components/PageTitle";

import ParticipantPage from "./ParticipantMangement";
import AchievementPage from "./AchievementManagement";
import EarnedAchievementPage from "./EarnedAchievementManagement";
import {
  useGetAchievementsQuery,
} from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";

const CrudTabPanel = () => {
  return (
    <TabGroup>
      <TabList className="flex">
        <Tab className="py-1 px-16 text-sm/6 font-semibold text-white data-[selected]:text-slate-100 bg-sky-600 focus:outline-none data-[selected]:bg-sky-500 data-[hover]:bg-sky-700 data-[selected]:data-[hover]:bg-sky-600 data-[focus]:outline-1">
          Participants
        </Tab>
        <Tab className="py-1 px-16 text-sm/6 font-semibold text-white data-[selected]:text-slate-100 bg-sky-600 focus:outline-none data-[selected]:bg-sky-500 data-[hover]:bg-sky-700 data-[selected]:data-[hover]:bg-sky-600 data-[focus]:outline-1">
          Achievements
        </Tab>
        <Tab className="py-1 px-16 text-sm/6 font-semibold text-white data-[selected]:text-slate-100 bg-sky-600 focus:outline-none data-[selected]:bg-sky-500 data-[hover]:bg-sky-700 data-[selected]:data-[hover]:bg-sky-600 data-[focus]:outline-1">
          Points
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <ParticipantPage />
        </TabPanel>
        <TabPanel>
          <AchievementPage />
        </TabPanel>
        <TabPanel>
          <EarnedAchievementPage />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
};

export default function ManagementPage() {
  const { isLoading: achievementsLoading } = useGetAchievementsQuery();

  if (achievementsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      <PageTitle title="League Management" />
      <CrudTabPanel />
    </div>
  );
}
