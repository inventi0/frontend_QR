// src/components/ReviewCard/ReviewCard.jsx
import React from 'react';
import './ReviewCard.scss';

export const ReviewCard = ({ stars, text, user, avatarUrl, variant = 'default' }) => {
  const renderStars = () => {
    const filled = '★'.repeat(stars);
    const empty = '☆'.repeat(5 - stars);
    return (
      <span>
        {filled.split('').map((star, i) => (
          <span key={i} className="star-filled">{star}</span>
        ))}
        {empty.split('').map((star, i) => (
          <span key={i + 5} className="star-empty">{star}</span>
        ))}
      </span>
    );
  };

  return (
    <div className={`review-card ${variant}`}>
      <div className="stars">{renderStars()}</div>
      <div className="text">{text}</div>
      <div className="user-info">
        <div className="avatar" style={{ backgroundImage: `url(${avatarUrl})` }}></div>
        <span>{user}</span>
      </div>
    </div>
  );
};