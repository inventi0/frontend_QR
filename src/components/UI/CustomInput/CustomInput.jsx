import React from "react";
import s from "./CustomInput.module.scss";
import { IMaskInput } from "react-imask";

const CustomInput = React.forwardRef(function CustomInput(
  { name, value, onChange, onBlur, placeholder, error, type = "text", maskOptions, options, ...rest },
  ref
) {
  return (
    <div className={s.input}>
      {type === "select" ? (
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`${s.input__main} ${error ? s.input__main__error : ""}`}
          {...rest}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : maskOptions ? (
        <IMaskInput
          {...maskOptions}
          inputRef={ref}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`${s.input__main} ${error ? s.input__main__error : ""}`}
          {...rest}
        />
      ) : (
        <input
          ref={ref}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`${s.input__main} ${error ? s.input__main__error : ""}`}
          {...rest}
        />
      )}
      {error && <div className={s.input__main__error__text}>{error}</div>}
    </div>
  );
});

export default CustomInput;
