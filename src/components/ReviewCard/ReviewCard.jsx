import React from "react";
import "./ReviewCard.scss";

export const ReviewCard = ({
  stars,
  text,
  user,
  avatarUrl,
  variant = "default",
  reviewId,
  isOwner = false,
  onDelete,
  onEdit,
}) => {
  const safeAvatar =
    avatarUrl ||
    "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/backProfile.png";

  const renderStars = () => {
    const filled = "★".repeat(stars);
    const empty = "☆".repeat(5 - stars);
    return (
      <span>
        {filled.split("").map((star, i) => (
          <span key={i} className="star-filled">
            {star}
          </span>
        ))}
        {empty.split("").map((star, i) => (
          <span key={i + 5} className="star-empty">
            {star}
          </span>
        ))}
      </span>
    );
  };

  const handleDelete = () => {
    if (window.confirm("Вы уверены, что хотите удалить этот отзыв?")) {
      onDelete?.(reviewId);
    }
  };

  return (
    <div className={`review-card ${variant}`}>
      {isOwner && (
        <div className="review-actions">
          <button className="edit-review-btn" onClick={onEdit} title="Редактировать отзыв">
            Редактировать
          </button>
          <button className="delete-review-btn" onClick={handleDelete} title="Удалить отзыв">
            Удалить
          </button>
        </div>
      )}
      <div className="stars">{renderStars()}</div>
      <div className="text">{text}</div>
      <div className="user-info">
        <div
          className="avatar"
          style={{ backgroundImage: `url(${safeAvatar})` }}
        ></div>
        <span>{user}</span>
      </div>
    </div>
  );
};
