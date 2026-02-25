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
      <div className="review-header">
        <div className="stars">{renderStars()}</div>
        {isOwner && (
          <div className="review-actions">
            <button className="edit-review-btn" onClick={onEdit} title="Редактировать">
              Редактировать
            </button>
            <button className="delete-review-btn" onClick={handleDelete} title="Удалить">
              Удалить
            </button>
          </div>
        )}
      </div>

      <div className="review-body">
        <div className="text-well">
          {text}
        </div>
      </div>

      <div className="review-footer">
        <div className="user-info">
          <div className="avatar-glass-frame">
            <div
              className="avatar"
              style={{ backgroundImage: `url(${safeAvatar})` }}
            ></div>
          </div>
          <span className="username">{user}</span>
        </div>
      </div>
    </div>
  );
};
