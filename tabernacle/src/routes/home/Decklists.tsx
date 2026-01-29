import { useState } from "react";
import { Route, Routes, Link } from "react-router-dom";

import { type SimpleColor } from "../../types/color_schemas";
import { useGetDecklistsQuery } from "../../api/apiSlice";
import { compileImgUrls, type Image } from "../../helpers/imgHelpers";
import { pointLookup } from "./DecklistForm";

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
      className="w-full overflow-hidden rounded-xl border bg-white shadow-sm
          transition-transform duration-200 ease-out md:hover:scale-[1.02]"
    >
      <Link to={url}>
        <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] bg-zinc-200 overflow-hidden">
          <DecklistImages name={name} imgs={imgs} />
        </div>
      </Link>

      <div className="pb-3 px-2 pt-2 sm:pb-4">
        <div className="text-sm font-semibold flex justify-between">
          <div className="text-base sm:text-lg truncate w-3/4">{name}</div>
          <div className="flex items-center gap-2 group">
            <i className="fa fa-arrow-up-right-from-square text-sky-500 invisible group-hover:visible" />
            <ColorGrid
              colors={color?.name}
              action={() => setOpen(true)}
              noHover
              show
              submitted
              isSmall
            />
          </div>
        </div>

        <div className="flex justify-between">
          <span>{points} Points </span>
          <span className="font-bold">{code}</span>
        </div>

        <div className="text-xs min-h-[1rem]">{pName ?? ""}</div>
      </div>
      <div className="pt-2 text-center text-[10px] text-slate-400">
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
