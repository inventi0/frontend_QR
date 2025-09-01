import React from "react";
import s from "./CustomInput.module.scss";

const CustomInput = React.forwardRef(function CustomInput(
  { name, value, onChange, onBlur, placeholder, error, type = "text" },
  ref
) {
  return (
    <div className={s.input}>
      <input
        ref={ref}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`${s.input__main} ${error ? s.input__main__error : ""}`}
      />
      {error && <div className={s.input__main__error__text}>{error}</div>}
    </div>
  );
});

export default CustomInput;
