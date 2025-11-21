import React, { useMemo, useState } from "react";
import { ReviewCard } from "../components/ReviewCard/ReviewCard";
import "./ReviewPage.scss";
import { Modal } from "../components/Modal/Modal";
import { ReviewForm } from "../components/ReviewForm/ReviewForm";
import {
  useCreateReviewMutation,
  useGetReviewsQuery,
} from "../api/reviewApi";
import { getSession } from "../utils/session";

export const ReviewPage = () => {
  const [showAll, setShowAll] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError, refetch } = useGetReviewsQuery(
    {
      limit: 100,
      skip: 0,
    },
    { refetchOnMountOrArgChange: true }
  );
  const [createReview, { isLoading: isSubmitting }] =
    useCreateReviewMutation();

  const selectVariant = (text) => {
    const length = text?.length || 0;
    if (length > 420) return "tall";
    if (length > 240) return "wide";
    return "default";
  };

  const reviews = useMemo(() => {
    if (data && Array.isArray(data)) {
      return data.map((item) => ({
        id: item.id,
        stars: item.stars,
        text: item.content,
        user: item.user?.username || item.user?.email || "Пользователь",
        avatarUrl: item.user?.img_url || null,
        variant: selectVariant(item.content),
      }));
    }
    return [];
  }, [data]);

  const visibleReviews = showAll ? reviews : reviews.slice(0, 6);

  const handleAddReview = async ({ stars, content }) => {
    setFormError("");
    const session = getSession();
    if (!session?.accessToken) {
      setFormError("Для отправки отзыва необходимо войти.");
      return false;
    }

    try {
      await createReview({ stars, content }).unwrap();
      setModalActive(false);
      refetch();
      return true;
    } catch (err) {
      const detail = err?.data?.detail;
      const message =
        (typeof detail === "string" && detail) ||
        err?.error ||
        "Не удалось отправить отзыв.";
      setFormError(message);
      return false;
    }
  };

  return (
    <div className="reviews-page">
      <h1 className="reviews-title">Отзывы Пользователей</h1>
      <div className="reviews-actions">
        <button className="review-button" onClick={() => setModalActive(true)}>
          Оставить отзыв
        </button>
        {isError && (
          <span className="reviews-error">
            Не удалось загрузить отзывы, попробуйте позже.
          </span>
        )}
      </div>

      {isLoading && (
        <div className="reviews-loader">
          <div className="spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-core"></div>
          </div>
          <span>Загружаем отзывы...</span>
        </div>
      )}

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

      {!isLoading && !isError && reviews.length === 0 && (
        <div className="reviews-empty">Отзывов пока нет.</div>
      )}

      {!showAll && reviews.length > 6 && (
        <button className="view-all-button" onClick={() => setShowAll(true)}>
          Показать еще
        </button>
      )}

      <Modal active={modalActive} setActive={setModalActive}>
        <ReviewForm
          onSubmit={handleAddReview}
          loading={isSubmitting}
          errorMessage={formError}
        />
      </Modal>
    </div>
  );
};
