// src/pages/ReviewPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { ReviewCard } from '../components/ReviewCard/ReviewCard';
import './ReviewPage.scss';
import { reviews } from '../utils/data'

export const ReviewPage = () => {
  const [showAll, setShowAll] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const containerRef = useRef(null);

  

  const visibleReviews = showAll ? reviews : reviews.slice(0, 6);

  const checkOverflow = () => {
    if (!containerRef.current) return;
    
    const containerHeight = containerRef.current.scrollHeight;
    const windowHeight = window.innerHeight;
    setShowButton(containerHeight > windowHeight * 1.2);
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="reviews-page">
      <h1 className="reviews-title">Отзывы Пользователей</h1>
      
      <div 
        ref={containerRef}
        className="reviews-container"
        style={{ marginBottom: showButton ? '100px' : '0' }}
      >
        {visibleReviews.map(review => (
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

      {showButton && !showAll && (
        <>
          <div className="gradient-overlay"></div>
          <button 
            className="view-all-button"
            onClick={() => {
              setShowAll(true);
              setTimeout(scrollToBottom, 100);
            }}
          >
            Посмотреть все отзывы
          </button>
        </>
      )}
    </div>
  );
};