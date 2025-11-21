import React, { useEffect, useState } from "react";
import "./AuthModal.scss";
import Close from "../icons/Close";
import { useRegisterMutation } from "../../api/authApi";

export const RegistrationForm = ({ onClose }) => {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [formValues, setFormValues] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    setAvatar(file || null);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formValues.email || !formValues.username || !formValues.password) {
      setError("Заполните все поля формы.");
      return;
    }

    if (!avatar) {
      setError("Добавьте файл аватара — это требование API.");
      return;
    }

    try {
      const user = await registerUser({
        email: formValues.email.trim(),
        username: formValues.username.trim(),
        password: formValues.password,
        avatar,
      }).unwrap();

      setSuccess(
        `Готово! Пользователь ${user.username ?? user.email} зарегистрирован. Теперь можно войти.`
      );
      window.location.reload();
      setFormValues({ email: "", username: "", password: "" });
      setAvatar(null);
      setAvatarPreview(null);
    } catch (err) {
      const detail = err?.data?.detail;
      const message = Array.isArray(detail)
        ? detail[0]?.msg
        : typeof detail === "string"
        ? detail
        : err?.error;
      setError(message || "Не удалось зарегистрироваться. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-card">
        <button className="auth-close" type="button" onClick={onClose}>
          <Close />
        </button>
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">
          Создайте аккаунт, чтобы сохранять шаблоны и управлять заказами.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formValues.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="auth-field">
            <span>Имя пользователя</span>
            <input
              type="text"
              name="username"
              placeholder="Ваш никнейм"
              value={formValues.username}
              onChange={handleChange}
              required
              minLength={3}
            />
          </label>

          <label className="auth-field">
            <span>Пароль</span>
            <input
              type="password"
              name="password"
              placeholder="Минимум 3 символа"
              value={formValues.password}
              onChange={handleChange}
              required
              minLength={3}
            />
          </label>

          <label className="auth-field auth-file-field">
            <div className="auth-file-label">
              <span>Аватар</span>
              <small>Обязателен по документации</small>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              required
            />
            {avatarPreview && (
              <div className="auth-file-preview">
                <img src={avatarPreview} alt="Превью аватара" />
                <span>{avatar?.name}</span>
              </div>
            )}
          </label>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading}
          >
            {isLoading ? "Отправляем..." : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
};
