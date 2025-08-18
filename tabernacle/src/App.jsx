import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./routes/routeHelper";
import auth from "./helpers/authHelpers";

import Navbar from "./components/Navbar";
import Home from "./routes/home/Home";
import Resources from "./routes/home/Resources";
import LeaderBoard from "./routes/leaderboard/Leaderboard";
import AchievementsPage from "./routes/achievements/Achievements";
import LeagueRouter from "./routes/leagueSession/LeagueSession";
import ManagementContainer from "./routes/crud/ManagementContainer";
import Metrics from "./routes/metrics/MetricsContainer";
import Pods from "./routes/pods/Pods";
import HallofFame from "./routes/halloffame/HallofFame";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { usePageTracking } from "./hooks";

function App() {
  const [loggedIn, setLoggedIn] = useState(!!auth.getToken());
  usePageTracking();

  return (
    <>
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/info" element={<Resources />} />
        <Route path="/leaderboard" element={<LeaderBoard />} />
        <Route path="/hall-of-fame/*" element={<HallofFame />} />
        <Route path="/achievements" element={<AchievementsPage />} />
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
        <Route path="*" element={<p>404 Error - Nothing here...</p>} />
      </Routes>
    </>
  );
}

export default App;
