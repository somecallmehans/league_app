import React from "react";
import Select from "react-select";

const buttonsClasses = "mx-2 text-slate-500";

export function EditButtons({
  editing,
  setEditing,
  deleteAction,
  formName,
  disabled,
  disableDelete,
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
            className={`fa-solid fa-trash ${buttonsClasses} ${
              disableDelete ? "hover:text-red-400" : "hover:text-sky-400"
            }`}
          />
        </div>
      )}
    </div>
  );
}

export function SimpleSelect({
  options,
  placeholder,
  value,
  classes,
  onChange,
  isMulti,
  isClearable,
  menuPlacement = "bottom",
}) {
  const portalTarget =
    typeof window !== "undefined" ? document.body : undefined;
  return (
    <div className={`${classes}`}>
      <Select
        options={options}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        isMulti={isMulti}
        classNamePrefix="rs"
        menuPortalTarget={portalTarget}
        menuPosition="fixed"
        menuPlacement={menuPlacement}
        menuShouldScrollIntoView={false}
        styles={{
          control: (base, state) => ({
            ...base,
            fontSize: 16,
            minHeight: 36,
            height: 36,
            borderColor: state.isFocused ? base.borderColor : base.borderColor,
          }),
          valueContainer: (base) => ({
            ...base,
            height: 36,
            padding: "0 8px",
          }),
          input: (base) => ({
            ...base,
            fontSize: 16,
            margin: 0,
            padding: 0,
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: 36,
          }),
          menu: (base) => ({
            ...base,
            fontSize: 16,
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        isClearable={isClearable}
      />
    </div>
  );
}

export function HelpfulWrapper({ hasData, message, children }) {
  if (hasData) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return <div className="text-2xl text-slate-400">{message}</div>;
}
