import React from 'react';
import './ProductCard.scss';

export const ProductCard = ({ title, image, description, width, height, position }) => {
  const style = {
    height: `${height}px`
  };

  return (
    <div className={`product-card ${position}`} style={style}>
      <img src={image} alt={title} className="product-image" />
      
      <div className="product-title-overlay">
        <div className="product-title">
          <span>{title}</span>
          <span className="product-description">{description}</span>
        </div>
      </div>
    </div>
  );
};