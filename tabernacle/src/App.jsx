import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
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

import { usePageTracking } from "./hooks";

function App() {
  const [loggedIn, setLoggedIn] = useState(!!auth.getToken());
  useGetAllConfigsQuery();
  usePageTracking();

  return (
    <>
      <Navbar loggedIn={loggedIn} />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={<Login loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
        />
        <Route
          path="/logout"
          element={<Logout loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
        />
        <Route path="/faqs" element={<Resources />} />
        <Route path="/decklists/*" element={<Decklists />} />
        <Route path="/leaderboard" element={<LeaderBoard />} />
        <Route path="/champions/*" element={<HallofFame />} />
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
      <Footer />
    </>
  );
}

export default App;
