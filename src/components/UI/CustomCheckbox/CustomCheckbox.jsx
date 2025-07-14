import React from 'react';
import './customCheckbox.scss';

const CustomCheckbox = ({ checked, onChange, label, id }) => {
  return (
    <label className="custom-checkbox" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
      />
      <span className="checkbox-box" />
      <span className="checkbox-label">{label}</span>
    </label>
  );
};

export default CustomCheckbox;
