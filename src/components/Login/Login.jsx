import React, { useState } from "react";
import "../Auth/AuthModal.scss";
import EyePasswordHide from "../icons/EyePasswordHide";
import EyePasswordShow from "../icons/EyePasswordShow";
import Close from "../icons/Close";
import { useLoginMutation, } from "../../api/authApi";
import { setSession } from "../../utils/session";

export const Login = ({ onClose, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!credentials.username) {
      errors.username = "Email обязателен";
    } else if (!emailRegex.test(credentials.username)) {
      errors.username = "Введите корректный email";
    }

    if (!credentials.password) {
      errors.password = "Пароль обязателен";
    } else if (credentials.password.length < 3) {
      errors.password = "Минимум 3 символа";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    try {
      const data = await login(credentials).unwrap();
      
      // Сохраняем токен
      setSession({
        accessToken: data.access_token,
        tokenType: data.token_type,
      });
      
      // Получаем информацию о пользователе и обновляем сессию с userId
      try {
        const meResponse = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost"}/users/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        
        if (meResponse.ok) {
          const userData = await meResponse.json();
          setSession({
            accessToken: data.access_token,
            tokenType: data.token_type,
            userId: userData.id,
          });
        }
      } catch (meErr) {
        console.warn("Не удалось получить информацию о пользователе:", meErr);
      }
      
      onSuccess?.(data);
      onClose?.();
      window.location.reload();
    } catch (err) {
      const detail = err?.data?.detail;
      let message = "Не удалось войти. Проверьте данные и попробуйте снова.";
      
      if (typeof detail === "string") {
        if (detail === "LOGIN_BAD_CREDENTIALS") {
          message = "Неверный email или пароль.";
        } else if (detail === "LOGIN_USER_NOT_VERIFIED") {
          message = "Пользователь не верифицирован.";
        } else {
          message = detail;
        }
      } else if (err?.error) {
        message = err.error;
      }
      
      setError(message);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-card">
        <button className="auth-close" type="button" onClick={onClose}>
          <Close />
        </button>
        <h1 className="auth-title">Авторизация</h1>
        <p className="auth-subtitle">Введите email и пароль, чтобы продолжить.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="username"
              placeholder="you@example.com"
              value={credentials.username}
              onChange={handleChange}
              className={fieldErrors.username ? "input-error" : ""}
              required
            />
            {fieldErrors.username && <span className="field-error-text">{fieldErrors.username}</span>}
          </label>

          <label className="auth-field">
            <span>Пароль</span>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Введите пароль"
                value={credentials.password}
                onChange={handleChange}
                className={fieldErrors.password ? "input-error" : ""}
                required
                minLength={3}
              />
              <span
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyePasswordHide /> : <EyePasswordShow />}
              </span>
            </div>
            {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
};
