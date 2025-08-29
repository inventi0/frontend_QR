import s from "./CustomInput.module.scss";

export default function CustomInput({
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
}) {
  return (
    <div className={s.input}>
      <input
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
}
