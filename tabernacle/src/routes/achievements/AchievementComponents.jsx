import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import { apiSlice } from "../../api/apiSlice";

import { hexToRgb } from "../../helpers/helpers";
import { buildAchievementEarningRules } from "../../types/achievement_schemas";

import Drawer from "../../components/Drawer";

export const RestrictionsList = ({ restrictions }) => {
  if (!restrictions.length > 0) return null;

  return (
    <div className="p-4">
      <div className="text-lg font-bold">Achievement Info</div>
      {restrictions.map(({ id, name, url }) => (
        <div key={id} className="py-1 text-base text-gray-600 italic">
          <a
            className={`${
              url ? "hover:text-sky-500" : ""
            } transition text-base`}
            href={url || undefined}
            target={url ? "_blank" : undefined}
            rel={url ? "noreferrer" : undefined}
          >
            {name}
            {url && <i className="fa-solid fa-link ml-1 text-gray-400" />}
          </a>
        </div>
      ))}
    </div>
  );
};

export const ChildrenList = ({ achievements }) => {
  if (!achievements.length > 0) return null;

  return (
    <div className="p-4">
      <div className="rounded-lg">
        {[...achievements]
          .sort((a, b) => a - b)
          .map(({ id, name }) => (
            <div
              key={id}
              className="bg-white flex items-center text-sm md:text-base rounded-lg mb-1 border p-2"
            >
              {name}
            </div>
          ))}
      </div>
    </div>
  );
};

export const AchievementPanel = ({
  point_value,
  children: achievementChildren,
  restrictions,
}) => {
  return (
    <div className="flex flex-col">
      <div className="text-xl grow  p-4 font-bold">
        {point_value} Point{point_value === 1 ? "" : "s"}
      </div>
      <RestrictionsList restrictions={restrictions} />
      <ChildrenList achievements={achievementChildren} />
    </div>
  );
};

export const AchievementCard = (props) => {
  const {
    name,
    point_value,
    children: achievementChildren,
    restrictions,
    type,
    rarity,
    rarity_hex,
  } = props;
  const [open, setOpen] = useState(false);
  const hex_code = type?.hex_code;

  const hasSubAchievements = achievementChildren.length > 0;
  const hasRestristictions = restrictions.length > 0;

  const hasAdditionalInformation = hasSubAchievements || hasRestristictions;

  const barStyle =
    rarity_hex && hex_code
      ? {
          background: `linear-gradient(to bottom, ${rarity_hex} 25%, ${hex_code} 25%)`,
          opacity: "60%",
        }
      : {
          backgroundColor: hex_code || rarity_hex,
          opacity: "60%",
        };

  return (
    <>
      <div
        onClick={() => (hasAdditionalInformation ? setOpen(!open) : "")}
        className={`py-3 px-4 relative bg-white rounded border border-solid shadow-md ${
          hasAdditionalInformation ? "hover:border-sky-400" : ""
        } md:min-h-24`}
      >
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            {point_value} Point{point_value === 1 ? "" : "s"}
            {rarity && (
              <span
                className="ml-2 text-xs font-medium"
                style={{ color: rarity_hex || undefined }}
              >
                {rarity}
              </span>
            )}
          </span>
          <div className="flex gap-1 pt-1">
            {hasSubAchievements && <i className="fa-solid fa-layer-group" />}
            {hasRestristictions && <i className="fa-solid fa-circle-info" />}
          </div>
        </div>
        <div>{name}</div>
        {hasAdditionalInformation && (
          <div className="absolute bottom-2 right-2">
            <i className="fa-solid fa-angle-right text-sky-400" />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l"
          style={barStyle}
        />
      </div>
      <Drawer isOpen={open} onClose={() => setOpen(false)} title={name}>
        <AchievementPanel {...props} />
      </Drawer>
    </>
  );
};

function EarningRuleCard({ name, hex_code, rule }) {
  const rgbVal = hex_code ? hexToRgb(hex_code) : null;
  const headerBg = rgbVal
    ? `rgba(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}, 0.35)`
    : undefined;
  const borderColor = rgbVal
    ? `rgba(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}, 0.55)`
    : undefined;

  return (
    <div
      className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-white"
      style={{ borderColor }}
    >
      <div
        className="px-3 py-2 text-sm font-semibold text-gray-900"
        style={{ backgroundColor: headerBg }}
      >
        {name}
      </div>
      <div className="px-3 py-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed">
        {rule}
      </div>
    </div>
  );
}

export const AchievementEarningRules = ({ showRules }) => {
  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined),
  );

  const rules = useMemo(() => buildAchievementEarningRules(types), [types]);

  if (!rules.length) return null;

  return (
    <div
      className={[
        "grid transition-all duration-200 ease-in-out overflow-hidden",
        showRules
          ? "mb-4 grid-rows-[1fr] opacity-100"
          : "mb-0 grid-rows-[0fr] opacity-0",
      ].join(" ")}
      aria-hidden={!showRules}
    >
      <div className="min-h-0">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 sm:p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {rules.map((entry) => (
              <EarningRuleCard key={entry.key} {...entry} />
            ))}
          </div>
          <div className="mt-3 flex justify-end pt-3">
            <Link
              to="/achievements/scalable-terms"
              className="text-xs sm:text-sm font-medium text-sky-600 hover:text-sky-500"
            >
              View complete list of scalable terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
