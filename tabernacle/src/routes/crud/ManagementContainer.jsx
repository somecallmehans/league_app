import React from "react";
import auth from "../../helpers/authHelpers.ts";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import PageTitle from "../../components/PageTitle";

import ParticipantPage from "./ParticipantMangement";
import AchievementPage from "./AchievementManagement";
import ScalableTermsPage from "./ScalableTermsManagement";
import InsertCommanderPage from "./InsertCommanders";
import UpdatePoints from "./UpdatePoints";
import LeagueConfiguration from "./LeagueConfiguration";
import AccountPage from "./AccountPage";
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminDecklistManagement from "./AdminDecklistManagement";

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
  const isSuper = auth.isSuperuser();

  return (
    <TabGroup>
      <TabList className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-4 mb-4">
        <ReusableTab name="Account" />
        <ReusableTab name="Participants" />
        <ReusableTab name="Update Points" />
        <ReusableTab name="League Configuration" />
        {isSuper && (
          <>
            <ReusableTab name="Achievements" />
            <ReusableTab name="Scalable Terms" />
            <ReusableTab name="Update Commanders" />
            <ReusableTab name="Decklists" />
          </>
        )}
      </TabList>
      <TabPanels className="mt-4">
        <TabPanel>
          <AccountPage />
        </TabPanel>
        <TabPanel>
          <ParticipantPage />
        </TabPanel>
        <TabPanel>
          <UpdatePoints />
        </TabPanel>

        <TabPanel>
          <LeagueConfiguration />
        </TabPanel>
        {isSuper && (
          <>
            <TabPanel>
              <AchievementPage />
            </TabPanel>
            <TabPanel>
              <ScalableTermsPage />
            </TabPanel>
            <TabPanel>
              <InsertCommanderPage />
            </TabPanel>
            <TabPanel>
              <AdminDecklistManagement />
            </TabPanel>
          </>
        )}
      </TabPanels>
    </TabGroup>
  );
};

export default function ManagementPage() {
  return (
    <div className="p-4">
      <PageTitle title="League Management" />
      <CrudTabPanel />
    </div>
  );
}
