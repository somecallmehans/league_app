import React, { useState } from "react";
import PageTitle from "../../components/PageTitle";

import { faqInfo } from "../../helpers/faqHelpers";

const FaqRow = ({ title, Component }) => {
  const [toggle, setToggle] = useState();
  return (
    <React.Fragment>
      <div className="text-2xl font-bold border-0 border-t border-slate-400">
        {title}{" "}
        <i
          onClick={() => setToggle(!toggle)}
          className={`fa fa-caret-${toggle ? "down" : "right"}`}
        />
      </div>
      {toggle && Component()}
    </React.Fragment>
  );
};

export default function FAQ() {
  return (
    <div className="p-8">
      <PageTitle title="Frequently Asked Questions" />
      {faqInfo.map((faq) => (
        <FaqRow key={faq.id} {...faq} />
      ))}
    </div>
  );
}
