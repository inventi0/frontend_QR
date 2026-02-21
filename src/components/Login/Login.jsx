import React, { useState } from "react";
import "../Auth/AuthModal.scss";
import EyePasswordHide from "../icons/EyePasswordHide";
import EyePasswordShow from "../icons/EyePasswordShow";
import Close from "../icons/Close";
import { useLoginMutation, useGetMeQuery } from "../../api/authApi";
import { setSession } from "../../utils/session";

export const Login = ({ onClose, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
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
      const message =
        (typeof detail === "string" && detail) ||
        err?.error ||
        "Не удалось войти. Проверьте данные и попробуйте снова.";
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
              required
            />
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
