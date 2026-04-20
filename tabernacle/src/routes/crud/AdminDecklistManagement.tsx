import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";

import {
  useGetAdminDecklistsQuery,
  useGetAdminDecklistByIdQuery,
  useAdminUpdateDecklistMutation,
} from "../../api/apiSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import { DecklistCard } from "../home/Decklists";
import { DecklistForm } from "../home/DecklistForm";
import { EditPageWrapper } from "../home/EditDecklists";
import { normalizeDecklistAchievements } from "../leagueSession/ScorecardPage";
import { toast } from "react-toastify";

export default function AdminDecklistManagement() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const listArg = debouncedSearch ? { search: debouncedSearch } : undefined;
  const { data: decklists, isLoading: listLoading } =
    useGetAdminDecklistsQuery(listArg);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [adminUpdateDecklist] = useAdminUpdateDecklistMutation();

  const decklistOrSkip =
    selectedId && !isDeleting ? { decklist_id: selectedId } : skipToken;
  const {
    data: decklist,
    isLoading: decklistLoading,
    isError: decklistError,
  } = useGetAdminDecklistByIdQuery(decklistOrSkip);

  if (selectedId) {
    if (decklistLoading) {
      return <LoadingSpinner />;
    }
    if (decklistError || !decklist) {
      return (
        <div className="space-y-3">
          <button
            type="button"
            className="text-sm font-semibold text-sky-600 hover:text-sky-800 underline"
            onClick={() => {
              setIsDeleting(false);
              setSelectedId(null);
            }}
          >
            Back to all decklists
          </button>
          <p className="text-red-600 text-sm">
            Could not load this decklist. It may have been removed.
          </p>
        </div>
      );
    }

    const handleUpdate = async (data: any) => {
      if (!selectedId) return;
      const { picker, code, ...clean } = data;
      const payload = {
        ...clean,
        id: +selectedId,
        commander: clean.commander?.id,
        partner: clean.partner?.id,
        companion: clean.companion?.id,
        achievements: normalizeDecklistAchievements(clean?.achievements) ?? [],
      };

      try {
        await adminUpdateDecklist(payload).unwrap();
        toast.success("Decklist updated successfully!");
        setSelectedId(null);
      } catch (error) {
        console.error("Failed to edit decklist.", error);
      }
    };

    const handleDelete = async () => {
      if (!selectedId) return;
      const payload = {
        id: +selectedId,
        deleted: true,
      };
      try {
        setIsDeleting(true);
        await adminUpdateDecklist(payload).unwrap();
        toast.success("Decklist deleted successfully!");
        setIsDeleting(false);
        setSelectedId(null);
      } catch (error) {
        setIsDeleting(false);
        console.error("Failed to delete decklist.", error);
      }
    };

    return (
      <div>
        <div className="mb-4">
          <button
            type="button"
            className="text-sm font-semibold text-sky-600 hover:text-sky-800 underline"
            onClick={() => {
              setIsDeleting(false);
              setSelectedId(null);
            }}
          >
            Back to all decklists
          </button>
        </div>
        <EditPageWrapper title="Edit decklist (admin)" countdown={null}>
          <DecklistForm
            mode="edit"
            initialValues={decklist}
            onSubmit={handleUpdate}
            onDelete={handleDelete}
            wrapperClasses=""
          />
        </EditPageWrapper>
      </div>
    );
  }

  if (listLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search by decklist or player name
        </label>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Filter…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <p className="text-sm text-gray-600">
        Select a decklist to edit achievements, commanders, and other fields.
        There is no session time limit for admin edits.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
        {decklists && decklists.length === 0 && (
          <p className="text-sm text-gray-600 col-span-full">
            {debouncedSearch
              ? "No decklists match your search."
              : "No active decklists found."}
          </p>
        )}
        {decklists?.map(
          ({
            id,
            name,
            commander_img,
            partner_img,
            companion_img,
            color,
            points,
            participant_name,
            code,
            achievements,
          }) => (
            <DecklistCard
              key={id}
              name={name}
              commander_img={commander_img}
              partner_img={partner_img}
              companion_img={companion_img}
              color={color}
              points={points}
              participant_name={participant_name}
              code={code}
              url=""
              achievements={achievements}
              onSelect={() => {
                setIsDeleting(false);
                setSelectedId(String(id));
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}
