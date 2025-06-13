export default function CustomInput({ name, value, onChange, placeholder }) {
  return (
    <input
      className="custom-input"
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ outline: "none" }}
    />
  );
}
