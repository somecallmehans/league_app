import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./routes/routeHelper";
import auth from "./helpers/authHelpers";

import Navbar from "./components/Navbar";
import Home from "./routes/home/Home";
import FAQ from "./routes/home/FAQ";
import LeaderBoard from "./routes/leaderboard/Leaderboard";
import AchievementsPage from "./routes/achievements/Achievements";
import LeagueRouter from "./routes/leagueSession/LeagueSession";
import ManagementContainer from "./routes/crud/ManagementContainer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(!!auth.getToken());

  return (
    <>
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/leaderboard" element={<LeaderBoard />} />
        <Route path="/achievements" element={<AchievementsPage />} />
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
        <Route path="*" element={<p>404 Error - Nothing here...</p>} />
      </Routes>
    </>
  );
}

export default App;
