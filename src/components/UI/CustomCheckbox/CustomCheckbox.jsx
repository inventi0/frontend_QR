import React, { forwardRef } from "react";
import "./CustomCheckbox.scss";

const CustomCheckbox = forwardRef(
  ({ checked, onChange, label, id, ...rest }, ref) => {
    return (
      <label className="custom-checkbox" htmlFor={id}>
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={checked}
          onChange={onChange}
          {...rest}
        />
        <span className="checkbox-box" />
        <span className="checkbox-label">{label}</span>
      </label>
    );
  }
);

CustomCheckbox.displayName = "CustomCheckbox";

export default CustomCheckbox;
