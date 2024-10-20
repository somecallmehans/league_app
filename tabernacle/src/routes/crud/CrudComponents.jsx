import React from "react";
import Select from "react-select";

const buttonsClasses = "mx-2 text-slate-500 hover:text-sky-600";

export function EditButtons({
  editing,
  setEditing,
  deleteAction,
  formName,
  disabled,
}) {
  return (
    <div>
      {editing ? (
        <div>
          <button
            type="submit"
            name={formName}
            disabled={disabled}
            className="fa-solid fa-check mx-2 text-sky-600 hover:text-sky-400 disabled:text-slate-500"
          />
          <i
            onClick={() => setEditing(false)}
            type="submit"
            className="fa-solid fa-circle-xmark mx-2 text-slate-500 hover:text-sky-400"
          />
        </div>
      ) : (
        <div>
          <i
            onClick={() => setEditing(true)}
            className="fa-solid fa-pencil mx-2 text-slate-500 hover:text-sky-600"
          />
          <i
            onClick={() => deleteAction()}
            className={`fa-solid fa-trash ${buttonsClasses}`}
          />
        </div>
      )}
    </div>
  );
}

export function SimpleSelect({
  options,
  placeholder,
  defaultValue,
  classes,
  onChange,
}) {
  return (
    <Select
      options={options}
      placeholder={placeholder}
      defaultValue={defaultValue?.value}
      className={`${classes}`}
      onChange={onChange}
    />
  );
}

export function HelpfulWrapper({ hasData, message, children }) {
  if (hasData) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return <div className="text-2xl text-slate-400">{message}</div>;
}
