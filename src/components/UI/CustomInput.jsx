export default function CustomInput({ value, onChange, placeholder }) {
  return (
    <input
      className="custom-input"
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
