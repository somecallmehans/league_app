import { useState } from "react";
import { Route, Routes, Link } from "react-router-dom";

import { type SimpleColor } from "../../types/color_schemas";
import { useGetDecklistsQuery } from "../../api/apiSlice";
import { compileImgUrls, type Image } from "../../helpers/imgHelpers";

import PageTitle from "../../components/PageTitle";
import StandardButton from "../../components/Button";
import DecklistForm from "./DecklistForm";
import DecklistImages from "./DecklistImages";
import ColorGrid from "../../components/ColorGrid";
import LoadingSpinner from "../../components/LoadingSpinner";
import CalloutCard from "../../components/CalloutCard";
import DecklistFilters from "./DecklistFiltering";
import Gatekeeper from "./DecklistEditGatekeeper";
import EditDecklists, { EditDecklistFormWrapper } from "./EditDecklists";
import AchievementModal, { type Achievement } from "./AchievementModal";

const Callout = () => (
  <div className="my-3 grid gap-3 md:grid-cols-2">
    <CalloutCard
      tag="Optional"
      title="Participation"
      tagClassName="bg-emerald-600"
      items={[
        <>
          Submitting a decklist is{" "}
          <span className="font-bold text-rose-700">not required</span> to play
          in Commander League.
        </>,
        <>
          Submitted decklists earn{" "}
          <span className="font-bold">1 extra point</span>.
        </>,
        "Only submit lists you curated, and add any qualifying achievements.",
      ]}
    />

    <CalloutCard
      tag="Info"
      title="Using this page"
      tagClassName="bg-violet-600"
      items={[
        "Use the toggles below to sort or filter by color identity.",
        "Each card image opens the decklist on Moxfield or Archidekt.",
        "Select card pips to view achievements earnable with that deck.",
        <>
          If you win with a shared decklist, submit the{" "}
          <span className="font-medium">DL-XXXX</span> code on your scorecard
          instead of listing achievements.
        </>,
      ]}
    />
  </div>
);

type DecklistProps = {
  name: string;
  commander_img: Image[];
  partner_img?: Image[] | null;
  companion_img?: Image[] | null;
  color: SimpleColor;
  points: number;
  participant_name: string | null;
  code: string;
  /** Used when `onSelect` is not set (external decklist URL or in-app path). */
  url: string;
  achievements: Achievement[];
  /** When set, the main image area opens selection instead of navigating. */
  onSelect?: () => void;
};

export const DecklistCard = ({
  name,
  commander_img,
  partner_img,
  companion_img,
  color,
  points,
  participant_name,
  code,
  url,
  achievements,
  onSelect,
}: DecklistProps) => {
  const [open, setOpen] = useState(false);

  const { imgs, artists } = compileImgUrls(
    commander_img,
    partner_img,
    companion_img,
  );
  const pName = participant_name ? `by ${participant_name}` : "";

  return (
    <div
      className="w-full min-w-0 overflow-hidden rounded-xl border border-stone-350 bg-stone-250 shadow-sm
          transition-transform duration-200 ease-out md:hover:scale-[1.01] h-full flex flex-col"
    >
      <div className="min-w-0">
        <div className="text-xs sm:text-sm md:text-xs lg:text-sm bg-gradient-to-r from-stone-100 to-stone-250 text-stone-900 font-bold text-center p-1 overflow-hidden truncate">
          {name}
        </div>
      </div>
      {onSelect ? (
        <button
          type="button"
          className="block w-full p-0 border-0 bg-transparent cursor-pointer text-left"
          onClick={onSelect}
        >
          <div className="relative w-full aspect-[1/1] sm:aspect-[4/3] overflow-hidden min-h-0">
            <DecklistImages name={name} imgs={imgs} />
          </div>
        </button>
      ) : (
        <Link to={url} target="_blank" rel="noopener noreferrer">
          <div className="relative w-full aspect-[1/1] sm:aspect-[4/3] overflow-hidden min-h-0">
            <DecklistImages name={name} imgs={imgs} />
          </div>
        </Link>
      )}
      <div className="px-1 pt-1 pb-1.5 md:px-2 md:pt-2 md:pb-3">
        <div className="grid gap-0.5 md:gap-1.5">
          <div className="flex gap-1 md:gap-2">
            <div className="min-w-0 flex-1 flex flex-col justify-center items-center gap-0.5 overflow-hidden">
              <div className="text-sm sm:text-lg md:text-sm lg:text-base font-semibold leading-tight">
                {points} Points
              </div>

              <div className="text-xs sm:text-base md:text-xs lg:text-sm font-medium text-stone-900 leading-tight truncate max-w-full">
                {code}
              </div>

              <div className="text-[10px] sm:text-xs md:text-[10px] min-h-[0.875rem] text-stone-900 leading-tight">
                {pName ?? ""}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ColorGrid
        colors={color?.name}
        action={() => setOpen(true)}
        show
        submitted
        noHover={false}
        isSmall
      />
      <div className="mt-auto pt-1.5 md:pt-2 text-center text-[8px] text-slate-400">
        Card art by {artists.join(", ")}
      </div>
      <AchievementModal
        achievements={achievements}
        colorPoints={color.points}
        isOpen={open}
        closeModal={() => setOpen(!open)}
      />
    </div>
  );
};

export type DecklistParams = {
  colors?: number | null;
  sort_order?: string | null;
  page?: number;
  page_size?: number;
};

function paginationRange(
  current: number,
  total: number,
  delta = 1,
): (number | "ellipsis")[] {
  const range: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }
  const withDots: (number | "ellipsis")[] = [];
  let prev: number | undefined;
  for (const i of range) {
    if (prev !== undefined && i - prev > 1) {
      withDots.push("ellipsis");
    }
    withDots.push(i);
    prev = i;
  }
  return withDots;
}

function DeckPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pageBtn =
    "min-w-[2.25rem] px-2 py-1.5 text-sm font-semibold rounded-lg border border-stone-300 bg-white text-stone-800 hover:bg-sky-50";
  const pageBtnActive =
    "min-w-[2.25rem] px-2 py-1.5 text-sm font-semibold rounded-lg border border-sky-500 bg-sky-500 text-white";
  const navBtn =
    "px-3 py-1.5 text-sm font-semibold rounded-lg border border-sky-600 bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed";
  const pages = paginationRange(page, totalPages);

  return (
    <nav
      className="my-3 flex flex-col items-stretch gap-2 sm:items-center"
      aria-label="Decklist pages"
    >
      <div className="flex md:hidden items-center justify-center gap-2">
        <button
          type="button"
          className={navBtn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="text-sm font-medium text-stone-700 tabular-nums px-2">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className={navBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
      <div className="hidden md:flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          className={navBtn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-sm text-stone-500 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={p === page ? pageBtnActive : pageBtn}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={navBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

function DecklistContainer() {
  const [params, setParams] = useState<DecklistParams>({
    page: 1,
    page_size: 20,
  });

  const queryParams: DecklistParams = {
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
  };
  if (params.colors !== undefined && params.colors !== null) {
    queryParams.colors = params.colors;
  }
  if (params.sort_order) {
    queryParams.sort_order = params.sort_order;
  }

  const { data, isLoading: decklistsLoading } =
    useGetDecklistsQuery(queryParams);

  const decklists = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageSize = data?.page_size ?? params.page_size ?? 20;
  const currentPage = data?.page ?? params.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const setPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setParams((prev) => ({ ...prev, page: next }));
  };

  if (decklistsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="px-4 py-3 md:p-8 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <PageTitle title="Decklists" />
        <div className="flex gap-1 sm:gap-2">
          <Link to="new">
            <StandardButton
              title="New"
              className="
              bg-sky-600 text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700
          text-xs sm:text-sm
          px-2 py-1 sm:px-4 sm:py-2
          min-w-[3.5rem] sm:min-w-24 md:min-w-40
        "
            />
          </Link>
          <Link to="gatekeeper">
            <StandardButton
              title="Edit"
              className="
          bg-sky-600 text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700
          text-xs sm:text-sm
          px-2 py-1 sm:px-4 sm:py-2
          min-w-[3.5rem] sm:min-w-24 md:min-w-40
        "
            />
          </Link>
        </div>
      </div>
      <Callout />
      <DecklistFilters params={params} setParams={setParams} />
      <p className="text-xs text-stone-600 mb-2">
        Showing {decklists.length} of {totalCount} decklist
        {totalCount === 1 ? "" : "s"}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 min-w-0">
        {decklists.map(
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
            url,
            achievements,
          }) => (
            <div key={id} className="min-w-0">
              <DecklistCard
                name={name}
                commander_img={commander_img}
                partner_img={partner_img}
                companion_img={companion_img}
                color={color}
                points={points}
                participant_name={participant_name}
                code={code}
                url={url}
                achievements={achievements}
              />
            </div>
          ),
        )}
      </div>
      <DeckPagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function DecklistsRouter() {
  return (
    <Routes>
      <Route path="/" element={<DecklistContainer />} />
      <Route path="/new" element={<DecklistForm />} />
      <Route path="/gatekeeper" element={<Gatekeeper />} />
      <Route path="/edit" element={<EditDecklists />} />
      <Route path="/edit/:decklist_id" element={<EditDecklistFormWrapper />} />
    </Routes>
  );
}
