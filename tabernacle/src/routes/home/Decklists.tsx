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
import DecklistFilters from "./DecklistFiltering";
import AchievementModal, { type Achievement } from "./AchievementModal";

type DecklistProps = {
  name: string;
  commander_img: Image[];
  partner_img?: Image[] | null;
  companion_img?: Image[] | null;
  color: SimpleColor;
  points: number;
  participant_name: string | null;
  code: string;
  url: string;
  achievements: Achievement[];
};

const DecklistCard = ({
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
}: DecklistProps) => {
  const [open, setOpen] = useState(false);

  const { imgs, artists } = compileImgUrls(
    commander_img,
    partner_img,
    companion_img
  );
  const pName = participant_name ? `by ${participant_name}` : "";

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-stone-350 bg-stone-250 shadow-sm
          transition-transform duration-200 ease-out md:hover:scale-[1.02] h-full flex flex-col"
    >
      <div className="min-w-0">
        <div className="text-sm bg-gradient-to-r from-stone-100 to-stone-250 text-stone-900 sm:text-base font-bold text-center p-1 overflow-hidden truncate">
          {name}
        </div>
      </div>
      <Link to={url}>
        <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] overflow-hidden">
          <DecklistImages name={name} imgs={imgs} />
        </div>
      </Link>
      <div className="px-2 pt-2 pb-3 sm:pb-4">
        <div className="grid gap-2">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 flex flex-col justify-center items-center gap-0.5">
              <div className="text-lg sm:text-xl font-semibold leading-tight">
                {points} Points
              </div>

              <div className="text-base sm:text-lg font-medium text-stone-900 leading-tight whitespace-nowrap">
                {code}
              </div>

              <div className="text-xs min-h-[1rem] text-stone-900 leading-tight">
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
      />
      <div className="mt-auto pt-2 text-center text-[8px] text-slate-400">
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
    <div className="p-2 md:p-8">
      <div className="flex justify-between items-center">
        <PageTitle title="Decklists" />
        <Link to={`new`}>
          <StandardButton title="New" />
        </Link>
      </div>
      <details className="w-full md:w-3/4 mb-3">
        <summary className="cursor-pointer text-lg font-medium text-gray-800">
          Click here for page information
        </summary>

        <div className="mt-2 text-xs md:text-sm text-gray-700 space-y-2">
          <p>
            Use the toggles below to sort or filter decklists by color identity.
          </p>

          <p>Each card image opens the decklist on Moxfield or Archidekt.</p>

          <p>
            Select the pips on each card to view the achievements earnable with
            that deck.
          </p>

          <p>
            If you win with a shared decklist, submit the
            <span className="font-medium"> DL-XXXX </span>
            code on your scorecard instead of listing achievements.
          </p>

          <p className="italic">Editing coming soon!</p>
        </div>
      </details>
      <DecklistFilters params={params} setParams={setParams} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
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
              url={url}
              achievements={achievements}
            />
          )
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
    </Routes>
  );
}
