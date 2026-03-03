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
  const [fieldErrors, setFieldErrors] = useState({});
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
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
    setFieldErrors({});

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formValues.email) {
      errors.email = "Email обязателен";
    } else if (!emailRegex.test(formValues.email)) {
      errors.email = "Введите корректный email";
    }

    if (!formValues.username) {
      errors.username = "Имя пользователя обязательно";
    } else if (formValues.username.trim().length < 3) {
      errors.username = "Минимум 3 символа";
    }

    if (!formValues.password) {
      errors.password = "Пароль обязателен";
    } else if (formValues.password.length < 3) {
      errors.password = "Минимум 3 символа";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const payload = {
        email: formValues.email.trim(),
        username: formValues.username.trim(),
        password: formValues.password,
      };
      if (avatar) {
        payload.avatar = avatar;
      }

      const user = await registerUser(payload).unwrap();

      setSuccess(
        `Готово! Пользователь ${user.username ?? user.email} зарегистрирован. Теперь можно войти.`
      );
      window.location.reload();
      setFormValues({ email: "", username: "", password: "" });
      setAvatar(null);
      setAvatarPreview(null);
    } catch (err) {
      const detail = err?.data?.detail;
      let message = "Не удалось зарегистрироваться. Попробуйте ещё раз.";

      if (Array.isArray(detail)) {
        message = detail[0]?.msg || message;
      } else if (typeof detail === "string") {
        if (detail === "REGISTER_USER_ALREADY_EXISTS") {
          message = "Пользователь с таким email уже существует.";
        } else if (detail.includes("already exists")) {
          message = "Пользователь с такими данными уже существует.";
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
              className={fieldErrors.email ? "input-error" : ""}
              required
            />
            {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
          </label>

          <label className="auth-field">
            <span>Имя пользователя</span>
            <input
              type="text"
              name="username"
              placeholder="Ваш никнейм"
              value={formValues.username}
              onChange={handleChange}
              className={fieldErrors.username ? "input-error" : ""}
              required
              minLength={3}
            />
            {fieldErrors.username && <span className="field-error-text">{fieldErrors.username}</span>}
          </label>

          <label className="auth-field">
            <span>Пароль</span>
            <input
              type="password"
              name="password"
              placeholder="Минимум 3 символа"
              value={formValues.password}
              onChange={handleChange}
              className={fieldErrors.password ? "input-error" : ""}
              required
              minLength={3}
            />
            {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
          </label>

          <label className="auth-field auth-file-field">
            <div className="auth-file-label">
              <span>Аватар (необязательно)</span>
              <small>Можно добавить позже в профиле</small>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
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
