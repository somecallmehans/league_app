import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import PrivateRoute from "./routes/routeHelper";
import auth from "./helpers/authHelpers";
import { useGetAllConfigsQuery } from "./api/apiSlice";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./routes/home/Home";
import Login from "./components/Login";
import Logout from "./components/Logout";
import Resources from "./routes/home/Resources";
import LeaderBoard from "./routes/leaderboard/Leaderboard";
import AchievementsPage from "./routes/achievements/Achievements";
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
  return <Outlet />;
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/faqs" element={<Resources />} />
        <Route path="/achievements" element={<AchievementsPage />} />
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
      <Footer />
    </div>
  );
}

export default App;
