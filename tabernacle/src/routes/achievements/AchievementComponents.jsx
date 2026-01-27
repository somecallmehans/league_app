import React, { useState } from "react";
import { useSelector } from "react-redux";

import { apiSlice } from "../../api/apiSlice";

import { hexToRgb } from "../../helpers/helpers";

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
  } = props;
  const [open, setOpen] = useState(false);
  const hex_code = type?.hex_code;

  const hasSubAchievements = achievementChildren.length > 0;
  const hasRestristictions = restrictions.length > 0;

  const hasAdditionalInformation = hasSubAchievements || hasRestristictions;

  return (
    <>
      <div
        onClick={() => (hasAdditionalInformation ? setOpen(!open) : "")}
        className={`py-3 px-4 relative bg-white rounded border border-solid shadow-md ${
          hasAdditionalInformation ? "hover:border-sky-400" : ""
        } md:min-h-24`}
      >
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          {point_value} Point{point_value === 1 ? "" : "s"}
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
          style={{ backgroundColor: hex_code, opacity: "60%" }}
        />
      </div>
      <Drawer isOpen={open} onClose={() => setOpen(false)} title={name}>
        <AchievementPanel {...props} />
      </Drawer>
    </>
  );
};

export const TypeInfo = ({ showInfo, setShowInfo }) => {
  const { data: types } = useSelector(
    apiSlice.endpoints.getAchievementTypes.select(undefined)
  );
  if (!types || types.length === 0) return null;

  const mobileDrawer = (
    <div className="sm:hidden">
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-50",
          "transform transition-transform duration-200 ease-out",
          showInfo ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={() => setShowInfo(false)}
          className="mx-auto max-w-lg rounded-t-2xl bg-white shadow-2xl border-t"
        >
          <div className="px-4 pt-3 pb-2">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300 mb-3" />
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Achievement Types
              </div>
              <div className="text-xs text-gray-500">Tap to close</div>
            </div>
          </div>

          <div className="px-4 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] max-h-[70vh] overflow-y-auto">
            <div className="space-y-3">
              {types.map(({ id, name, hex_code, description }) => {
                const rgbVal = hex_code ? hexToRgb(hex_code) : null;
                const rgbString = rgbVal
                  ? `rgba(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}, 0.4)`
                  : undefined;

                return (
                  <div key={id} className="rounded-md border p-3">
                    <div
                      className="text-center rounded mb-2 py-1 text-sm font-medium"
                      style={{ backgroundColor: rgbString }}
                    >
                      {name}
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed">
                      {description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const desktopInline = (
    <div
      className={`hidden sm:flex transition-all ease-in-out duration-200 overflow-hidden ${
        showInfo
          ? "opacity-100 max-h-50 bg-white border shadow-md flex-col md:flex-row justify-between p-3 gap-4"
          : "opacity-0 max-h-0"
      }`}
    >
      {types.map(({ id, name, hex_code, description }) => {
        const rgbVal = hex_code ? hexToRgb(hex_code) : null;
        const rgbString = rgbVal
          ? `rgba(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}, 0.4)`
          : undefined;

        return (
          <div key={id} className="flex-1 min-w-0">
            <div
              className="text-center rounded mb-1"
              style={{ backgroundColor: rgbString }}
            >
              {name}
            </div>
            <div className="text-xs">{description}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {mobileDrawer}
      {desktopInline}
    </>
  );
};
