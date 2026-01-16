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
}: DecklistProps) => {
  const { imgs, artists } = compileImgUrls(
    commander_img,
    partner_img,
    companion_img
  );
  const colorPoints =
    color?.symbol === "c" ? 5 : (pointLookup[color?.symbol.length] ?? 0);
  const totalPoints = points + colorPoints;
  const pName = participant_name ? `by ${participant_name}` : "";
  return (
    <Link to={url}>
      <div
        className="relative w-full max-w-sm md:max-w-lg bg-white border rounded-xl shadow-lg overflow-hidden transition-transform duration-200 ease-out
  hover:scale-[1.03]"
      >
        <div className="relative w-full aspect-[4/3] bg-zinc-200 overflow-hidden">
          <DecklistImages name={name} imgs={imgs} />
        </div>
        <div className="pb-4 px-2 pt-2">
          <div className="text-sm font-semibold flex justify-between">
            <div className="text-lg truncate w-3/4">{name}</div>
            <ColorGrid colors={color?.name} noHover show submitted isSmall />
          </div>
          <div className="flex justify-between">
            <span>{totalPoints} Points </span>
            <span className="font-bold">{code}</span>
          </div>
          <div className="text-xs">{pName}</div>
        </div>
        <div className="absolute bottom-0 inset-x-0 w-full text-center text-[8px] text-slate-400">
          Card art by {artists.join(", ")}
        </div>
      </div>
    </Link>
  );
};

function DecklistContainer() {
  const { data: decklists, isLoading: decklistsLoading } =
    useGetDecklistsQuery();

  if (decklistsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-8 md:p-16">
      <div className="flex justify-between items-center">
        <PageTitle title="Decklists" />
        <Link to={`new`}>
          <StandardButton title="New" />
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3 h-full">
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
