import React, { useState } from "react";
import "./Login.scss";
import EyePasswordHide from "../icons/EyePasswordHide";
import EyePasswordShow from "../icons/EyePasswordShow";

export const Login = ({ onClickHandler }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <button onClick={onClickHandler} className="login-close-button">
        <svg
          width="42"
          height="35"
          viewBox="0 0 41 41"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.7882 32.6173L8.82841 28.6575L16.748 20.7379L8.82841 12.8183L12.7882 8.85852L20.7078 16.7781L28.6274 8.85852L32.5872 12.8183L24.6676 20.7379L32.5872 28.6575L28.6274 32.6173L20.7078 24.6977L12.7882 32.6173Z"
            fill="#EE5959"
          />
        </svg>
      </button>

      <div className="login-form">
        <div className="login-title">Авторизация</div>

        <div className="login-input-wrapper">
          <span className="icon">
            <svg
              width="25"
              height="22"
              viewBox="0 0 34 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M30.6 0H3.4C1.5232 0 0 1.5232 0 3.4V23.8C0 25.6768 1.5232 27.2 3.4 27.2H30.6C32.4768 27.2 34 25.6768 34 23.8V3.4C34 1.5232 32.4768 0 30.6 0ZM30.6 7.99L17 17.0578L3.4 7.99V3.9049L17 12.971L30.6 3.9049V7.99Z"
                fill="#606060"
              />
            </svg>
          </span>
          <input type="email" placeholder="Enter email address" />
        </div>

        <div className="login-input-wrapper">
          <span className="icon">
            <svg
              width="25"
              height="22"
              viewBox="0 0 26 33"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.8881 0C8.44654 0 4.83304 3.6135 4.83304 8.05507V12.8881H3.22203C1.44347 12.8881 0 14.3316 0 16.1101V28.9982C0 30.7768 1.44347 32.2203 3.22203 32.2203H6.44405H11.2771H14.4991H17.7211H22.5542C24.3327 32.2203 25.7762 30.7768 25.7762 28.9982V16.1101C25.7762 14.3316 24.3327 12.8881 22.5542 12.8881H20.9432V8.05507C20.9432 3.6135 17.3297 0 12.8881 0ZM8.05507 8.05507C8.05507 5.39045 10.2235 3.22203 12.8881 3.22203C15.5527 3.22203 17.7211 5.39045 17.7211 8.05507V12.8881H8.05507V8.05507ZM14.4991 25.33V28.9982H11.2771V25.33C10.1059 24.6501 9.39382 23.2711 9.76435 21.7471C10.0479 20.5871 11.0209 19.6495 12.1905 19.4063C14.2752 18.9681 16.1101 20.5453 16.1101 22.5542C16.1101 23.7447 15.4593 24.7725 14.4991 25.33Z"
                fill="#606060"
              />
            </svg>
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
        <button className="login-button">LOGIN</button>

        <div className="login-footer">
          <span className="login-link">Забыл пароль?</span>
        </div>
      </div>
    </div>
  );
};
