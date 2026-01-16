import React, { useMemo, useState } from "react";
import { ReviewCard } from "../components/ReviewCard/ReviewCard";
import "./ReviewPage.scss";
import { Modal } from "../components/Modal/Modal";
import { ReviewForm } from "../components/ReviewForm/ReviewForm";
import {
  useCreateReviewMutation,
  useGetReviewsQuery,
  useGetMyReviewQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from "../api/reviewApi";
import { getSession } from "../utils/session";

export const ReviewPage = () => {
  const [showAll, setShowAll] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [formError, setFormError] = useState("");
  
  const session = getSession();
  const isAuthenticated = !!session?.accessToken;
  const currentUserId = session?.userId;

  const { data, isLoading, isError, refetch } = useGetReviewsQuery(
    {
      limit: 100,
      skip: 0,
    },
    { refetchOnMountOrArgChange: true }
  );
  const [createReview, { isLoading: isSubmitting }] =
    useCreateReviewMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();
  
  const { data: myReview } = useGetMyReviewQuery(undefined, {
    skip: !isAuthenticated,
  });
  
  const hasExistingReview = !!myReview;

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
        userId: item.user?.id,
      }));
    }
    return [];
  }, [data]);

  const visibleReviews = showAll ? reviews : reviews.slice(0, 6);

  const handleAddReview = async ({ stars, content }) => {
    setFormError("");
    if (!isAuthenticated) {
      setFormError("Для отправки отзыва необходимо войти.");
      return false;
    }

    try {
      if (hasExistingReview) {
        await updateReview({ 
          reviewId: myReview.id, 
          stars, 
          content 
        }).unwrap();
      } else {
        await createReview({ stars, content }).unwrap();
      }
      setModalActive(false);
      refetch();
      return true;
    } catch (err) {
      const detail = err?.data?.detail;
      let message = "Не удалось отправить отзыв.";
      
      if (typeof detail === "object" && detail?.msg) {
        message = detail.msg;
      } else if (typeof detail === "string") {
        message = detail;
      } else if (err?.error) {
        message = err.error;
      }
      
      setFormError(message);
      return false;
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId).unwrap();
      refetch();
    } catch (err) {
      alert("Не удалось удалить отзыв");
    }
  };

  return (
    <div className="reviews-page">
      <h1 className="reviews-title">Отзывы Пользователей</h1>
      <div className="reviews-actions">
        {isAuthenticated && (
          <button className="review-button" onClick={() => setModalActive(true)}>
            {hasExistingReview ? "Редактировать отзыв" : "Оставить отзыв"}
          </button>
        )}
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
            reviewId={review.id}
            stars={review.stars}
            text={review.text}
            user={review.user}
            avatarUrl={review.avatarUrl}
            variant={review.variant}
            isOwner={isAuthenticated && currentUserId === review.userId}
            onDelete={handleDeleteReview}
            onEdit={() => setModalActive(true)}
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
          loading={isSubmitting || isUpdating}
          errorMessage={formError}
          initialData={hasExistingReview ? myReview : null}
          isEdit={hasExistingReview}
        />
      </Modal>
    </div>
  );
};

// ✅ Default export для lazy loading
export default ReviewPage;
