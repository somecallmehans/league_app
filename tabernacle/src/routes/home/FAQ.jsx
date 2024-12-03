import React, { useState } from "react";
import PageTitle from "../../components/PageTitle";
import { faqInfo } from "../../helpers/faqHelpers";

const FaqRow = ({ title, Component }) => {
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
      {toggle && (
        <div className="mt-3 text-slate-600 leading-relaxed">
          <Component />
        </div>
      )}
    </div>
  );
};

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <PageTitle title="Frequently Asked Questions" />
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-4">
          {faqInfo.map((faq) => (
            <FaqRow key={faq.id} {...faq} />
          ))}
        </div>
      </div>
    </div>
  );
}
