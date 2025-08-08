import React, { useState } from "react";
import PageTitle from "../../components/PageTitle";
import { faqInfo, resourceInfo } from "../../helpers/faqHelpers";

const ResourceRow = ({ title, Component }) => {
  const [toggle, setToggle] = useState(false);

  return (
    <div className="border-b border-slate-200 py-4">
      <div
        onClick={() => setToggle(!toggle)}
        className="flex justify-between items-center cursor-pointer group"
      >
        <h3 className="text-lg font-medium text-slate-800 group-hover:text-blue-500 transition duration-200">
          {title}
        </h3>
        <i
          className={`fa fa-chevron-${
            toggle ? "down" : "right"
          } mr-2 text-slate-500 group-hover:text-blue-400 transition duration-200`}
        />
      </div>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          toggle ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-3 text-slate-600 leading-relaxed">
          <Component />
        </div>
      </div>
    </div>
  );
};

export default function Resources() {
  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <PageTitle title="League Information" />
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-4 mb-4">
        <h2
          className="text-2xl font-bold text-blue-600 mb-4"
          style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)" }}
        >
          Resources
        </h2>
        {resourceInfo.map((faq) => (
          <ResourceRow key={faq.id} {...faq} />
        ))}
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-4">
        <h2
          className="text-2xl font-bold text-blue-600 mb-4"
          style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)" }}
        >
          Frequently Asked Questions
        </h2>
        {faqInfo.map((faq) => (
          <ResourceRow key={faq.id} {...faq} />
        ))}
      </div>
    </div>
  );
}
