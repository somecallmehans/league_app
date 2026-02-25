import React from "react";
import { Routes, Route } from "react-router-dom";
import AchievementsPage from "./Achievements";
import ScalableTermsPage from "./ScalableTerms";

export default function AchievementsRouter() {
  return (
    <Routes>
      <Route path="/" element={<AchievementsPage />} />
      <Route path="/scalable-terms" element={<ScalableTermsPage />} />
    </Routes>
  );
}
