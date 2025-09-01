import React, { useState } from "react";
import { ReviewCard } from "../components/ReviewCard/ReviewCard";
import "./ReviewPage.scss";
import { reviews as initialReviews } from "../utils/data";
import { Modal } from "../components/Modal/Modal";
import { ReviewForm } from "../components/ReviewForm/ReviewForm";

export const ReviewPage = () => {
  const [showAll, setShowAll] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [allReviews, setAllReviews] = useState(initialReviews);

  const visibleReviews = showAll ? allReviews : allReviews.slice(0, 6);

  const handleAddReview = (newReview) => {
    setAllReviews((prev) => [{ id: Date.now(), ...newReview }, ...prev]);
    setModalActive(false);
  };

  return (
    <div className="reviews-page">
      <h1 className="reviews-title">Отзывы Пользователей</h1>
      <button className="review-button" onClick={() => setModalActive(true)}>
        Оставить отзыв
      </button>

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
          Показать еще
        </button>
      )}

      <Modal active={modalActive} setActive={setModalActive}>
        <ReviewForm onSubmit={handleAddReview} />
      </Modal>
    </div>
  );
};
