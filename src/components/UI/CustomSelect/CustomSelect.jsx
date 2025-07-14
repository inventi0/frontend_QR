import React from 'react';
import './customSelect.scss';

const CustomSelect = ({ options = [], value, onChange, id, placeholder }) => {
  return (
    <div className="custom-select-wrapper">
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="custom-select"
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt, index) => (
          <option key={index} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="custom-arrow">&#9662;</div>
    </div>
  );
};

export default CustomSelect;
