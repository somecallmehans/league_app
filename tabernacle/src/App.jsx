import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import PrivateRoute from "./routes/routeHelper";
import auth from "./helpers/authHelpers";
import { useGetAllConfigsQuery, useGetStoreQuery } from "./api/apiSlice";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import InactiveStoreOverlay from "./components/InactiveStoreOverlay";
import Home from "./routes/home/Home";
import Login from "./components/Login";
import Logout from "./components/Logout";
import Resources from "./routes/home/Resources";
import LeagueStores from "./routes/home/SupportedStores";
import LeaderBoard from "./routes/leaderboard/Leaderboard";
import AchievementsRouter from "./routes/achievements/AchievementsRouter";
import LeagueRouter from "./routes/leagueSession/LeagueSession";
import ManagementContainer from "./routes/crud/ManagementContainer";
import Metrics from "./routes/metrics/MetricsContainer";
import Pods from "./routes/pods/Pods";
import HallofFame from "./routes/halloffame/HallofFame";
import Decklists from "./routes/home/Decklists";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStoreSlug } from "./helpers/helpers";

import { usePageTracking } from "./hooks";

function getApexUrl() {
  const parts = window.location.hostname.split(".");
  const base = parts.length >= 3 ? parts.slice(1).join(".") : parts.join(".");
  return `${window.location.protocol}//${base}`;
}

const NotFoundPage = ({ storeSlug }) => {
  if (!storeSlug) return <Navigate to="/" replace />;
  return (
    <div className="text-3xl flex h-96 w-full items-center justify-center">
      <span>Page Not Found</span>
    </div>
  );
};

function RequireStore({ storeSlug }) {
  if (!storeSlug) return <Navigate to="/" replace />;

  const { data: store, isLoading, isError } = useGetStoreQuery();

  if (isLoading) return null;

  if (isError || store === null || store === undefined) {
    window.location.replace(getApexUrl());
    return null;
  }

  return (
    <>
      {store.is_active === false && (
        <InactiveStoreOverlay storeName={store.name} />
      )}
      <Outlet />
    </>
  );
}

function App() {
  const storeSlug = getStoreSlug();
  const [loggedIn, setLoggedIn] = useState(!!auth.getToken());
  useGetAllConfigsQuery(undefined, { skip: !storeSlug });
  usePageTracking();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar loggedIn={loggedIn} isStore={!!storeSlug} />
      <ToastContainer />
      <main className="flex-1 flex flex-col min-h-0">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/faqs" element={<Resources />} />
        <Route path="/supported-stores" element={<LeagueStores />} />
        <Route path="/achievements/*" element={<AchievementsRouter />} />
        <Route element={<RequireStore storeSlug={storeSlug} />}>
          <Route
            path="/login"
            element={<Login loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
          />
          <Route
            path="/logout"
            element={<Logout loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
          />
          <Route path="/decklists/*" element={<Decklists />} />
          <Route path="/leaderboard" element={<LeaderBoard />} />
          <Route path="/champions/*" element={<HallofFame />} />
          <Route path="/metrics/*" element={<Metrics />} />
          <Route
            path="/management"
            element={
              <PrivateRoute loggedIn={loggedIn}>
                <ManagementContainer />
              </PrivateRoute>
            }
          />
          <Route
            path="/league-session/*"
            element={
              <PrivateRoute loggedIn={loggedIn}>
                <LeagueRouter />
              </PrivateRoute>
            }
          />
          <Route path="/pods/*" element={<Pods />} />
        </Route>
        <Route path="*" element={<NotFoundPage storeSlug={storeSlug} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
