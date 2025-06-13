export default function CustomInput({
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
}) {
  return (
    <div className={`input-wrapper ${error ? "has-error" : ""}`}>
      <input
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className="custom-input"
      />
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
