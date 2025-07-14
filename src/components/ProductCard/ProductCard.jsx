import React from 'react';
import './ProductCard.scss';

export const ProductCard = ({ title, image, description, width, height, position }) => {
  const style = {
    width: `${width}px`,
    height: `${height}px`
  };

  return (
    <div className={`product-card ${position}`} style={style}>
      <img src={image} alt={title} className="product-image" />
      
      {/* Полупрозрачная плашка с названием */}
      <div className="product-title-overlay">
        <div className="product-title">
          <span>{title}</span>
          <span className="product-description">{description}</span>
        </div>
      </div>
    </div>
  );
};