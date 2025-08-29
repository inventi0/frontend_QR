import React, { useState } from "react";
import { ReviewCard } from "../components/ReviewCard/ReviewCard";
import "./ReviewPage.scss";
import { reviews } from "../utils/data";
import backProfile from "../assets/backProfile.png";

export const ReviewPage = () => {
  const [showAll, setShowAll] = useState(false);

  const visibleReviews = showAll ? reviews : reviews.slice(0, 6);

  return (
    <div
      className="reviews-page"
      style={{ backgroundImage: `url(${backProfile})`, backgroundRepeat: "no-repeat"}}
    >
      <h1 className="reviews-title">Отзывы Пользователей</h1>

      <div className="reviews-container">
        {visibleReviews.map((review) => (
          <ReviewCard
            key={review.id}
            stars={review.stars}
            text={review.text}
            user={review.user}
            avatarUrl={review.avatarUrl}
            variant={review.variant}
          />
        ))}
      </div>

      {!showAll && (
        <button className="view-all-button" onClick={() => setShowAll(true)}>
          Посмотреть все отзывы
        </button>
      )}
    </div>
  );
};
