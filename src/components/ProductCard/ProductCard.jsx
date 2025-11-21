import React from "react";
import "./ProductCard.scss";

export const ProductCard = ({
  title,
  image,
  description,
  width,
  height,
  position,
  onClickHandler,
  isComingSoon = false,
}) => {
  const style = {
    height: `${height}px`,
  };

  return (
    <div
      className={`product-card ${position} ${isComingSoon ? "coming-soon" : ""}`}
      style={style}
      onClick={isComingSoon ? undefined : onClickHandler}
    >
      <img src={image} alt={title} className="product-image" />

      <div className="product-title-overlay">
        <div className="product-title">
          <span>{title}</span>
          <span className="product-description">{description}</span>
        </div>
      </div>

      {isComingSoon && <div className="product-badge">Coming soon</div>}
    </div>
  );
};
