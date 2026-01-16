import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPublicProfileQuery } from "../api/authApi";
import "./PublicProfilePage.scss";

export const PublicProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data: profile, isLoading, isError } = useGetPublicProfileQuery(userId);

  if (isLoading) {
    return (
      <div className="public-profile-loading">
        <div className="spinner-ring"></div>
        <p>Загружаем профиль...</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="public-profile-error">
        <h2>Профиль не найден</h2>
        <p>Пользователь с ID {userId} не существует или профиль недоступен.</p>
        <button className="back-btn" onClick={() => navigate("/")}>
          На главную
        </button>
      </div>
    );
  }

  // Если это владелец, редирект на обычный профиль
  if (profile.is_owner) {
    navigate("/profile", { replace: true });
    return null;
  }

  return (
    <div className="public-profile-page">
      <div className="public-profile-container">
        {/* Шапка профиля */}
        <div className="profile-hero">
          <div className="profile-avatar-large">
            <img
              src={profile.avatar_url || "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/Avatar.png"}
              alt={profile.username}
            />
          </div>
          <h1 className="profile-username">{profile.username}</h1>
          <p className="profile-tagline">Дизайнер на Scan & Style</p>
        </div>

        {/* Активный шаблон */}
        {profile.active_template_file_url ? (
          <div className="featured-template-section">
            <h2>Избранный дизайн</h2>
            <div className="featured-template">
              <img
                src={profile.active_template_file_url}
                alt={profile.active_template_name || "Дизайн"}
                className="template-image"
              />
              {profile.active_template_name && (
                <div className="template-info">
                  <h3>{profile.active_template_name}</h3>
                </div>
              )}
            </div>
            <p className="template-hint">
              Это активный дизайн пользователя. Отсканируйте QR-код, чтобы вернуться сюда!
            </p>
          </div>
        ) : (
          <div className="no-template-section">
            <p className="muted">
              У пользователя пока нет активного дизайна.
            </p>
          </div>
        )}

        {/* Кнопка перехода на сайт */}
        <button className="back-home-btn" onClick={() => navigate("/")}>
          Посетить сайт
        </button>
      </div>
    </div>
  );
};

// ✅ Default export для lazy loading
export default PublicProfilePage;
