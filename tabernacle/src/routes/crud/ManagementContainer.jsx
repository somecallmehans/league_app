import React from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import PageTitle from "../../components/PageTitle";

import ParticipantPage from "./ParticipantMangement";
import AchievementPage from "./AchievementManagement";
import EarnedAchievementPage from "./EarnedAchievementManagement";
import { useGetAchievementsQuery } from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";

const ReusableTab = ({ name }) => (
  <Tab
    className={({ selected }) =>
      `py-2 px-6 sm:px-12 text-sm font-semibold rounded-lg ${
        selected
          ? "bg-sky-500 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500`
    }
  >
    {name}
  </Tab>
);

const CrudTabPanel = () => {
  return (
    <TabGroup>
      <TabList className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-4 mb-4">
        <ReusableTab name="Participants" />
        <ReusableTab name="Achievements" />
        {/* <ReusableTab name="Points" /> */}
      </TabList>
      <TabPanels className="mt-4">
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
