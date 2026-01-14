import { Route, Routes, Link } from "react-router-dom";

import {
  usePostDecklistMutation,
  useGetDecklistsQuery,
} from "../../api/apiSlice";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import DecklistForm from "./DecklistForm";

function DecklistContainer() {
  return (
    <div className="p-4 md:p-8 mx">
      <div className="flex justify-between items-center">
        <PageTitle title="Decklists" />
        <Link to={`new`}>
          <StandardButton title="New" />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 h-full border">COMING SOON</div>
    </div>
  );
}

export default function DecklistsRouter() {
  return (
    <Routes>
      <Route path="/" element={<DecklistContainer />} />
      <Route path="/new" element={<DecklistForm />} />
    </Routes>
  );
}
