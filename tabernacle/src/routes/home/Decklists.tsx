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
};

function DecklistContainer() {
  const [params, setParams] = useState<DecklistParams>({});

  const token = Object.keys(params).length === 0 ? {} : params;
  const { data: decklists, isLoading: decklistsLoading } =
    useGetDecklistsQuery(token);

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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 min-w-0">
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
