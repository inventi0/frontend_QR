import React, { useState } from "react";
import "./Login.scss";
import EyePasswordHide from "../icons/EyePasswordHide";
import EyePasswordShow from "../icons/EyePasswordShow";
import Mail from "../icons/Mail";
import Close from "../icons/Close";
import Lock from "../icons/Lock";

export const Login = ({ onClickHandler }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <button onClick={onClickHandler} className="login-close-button">
        <Close />
      </button>

      <div className="login-form">
        <div className="login-title">Авторизация</div>

        <div className="login-input-wrapper">
          <span className="icon">
            <Mail />
          </span>
          <input type="email" placeholder="Enter email address" />
        </div>

        <div className="login-input-wrapper">
          <span className="icon">
            <Lock />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
          />
          <span
            className="toggle-visibility"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyePasswordHide /> : <EyePasswordShow />}
          </span>
        </div>
        <button className="login-button__modal">LOGIN</button>

        <div className="login-footer">
          <span className="login-link">Забыл пароль?</span>
        </div>
      </div>
    </div>
  );
};
