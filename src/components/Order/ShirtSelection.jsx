import { useState } from "react";
import "./Order.scss";
import { useGetProductQuery } from "../../api/productApi";
import { formatRub } from "../../utils/money";
import whiteImg from "../../assets/white.png";
import blackImg from "../../assets/black.png";

export const ShirtSelection = ({ onNext, onClose, productId }) => {
  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("M");

  const { data: product, isLoading: isPriceLoading } = useGetProductQuery(productId, {
    skip: !productId,
  });
  const basePrice = product?.price;
  const preorderPrice = basePrice != null ? Math.round(basePrice * 0.8) : null;

  const tshirtImage =
    selectedColor === "white"
      ? whiteImg
      : blackImg;

  const handleNext = (type) => {
    onNext({
      tshirtImage: tshirtImage,
      size: selectedSize,
      color: selectedColor === "white" ? "Белая" : "Чёрная",
      type,
      basePrice,
      finalPrice: type === "preorder" ? preorderPrice : basePrice,
    });
  };

  return (
    <div className="modal-panel shirt-selection">
      <button
        type="button"
        className="close-btn"
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </button>
      <h2>Выберите футболку</h2>

      <div className="shirt-options">
        <div
          className={`shirt-box ${selectedColor === "white" ? "active" : ""}`}
          onClick={() => setSelectedColor("white")}
        >
          <img
            src={whiteImg}
            alt="white"
          />
        </div>
        <div
          className={`shirt-box ${selectedColor === "black" ? "active" : ""}`}
          onClick={() => setSelectedColor("black")}
        >
          <img
            src={blackImg}
            alt="black"
          />
        </div>
      </div>

      <div className="size-select">
        <p>Размер</p>
        {["S", "M", "L", "XL"].map((size) => (
          <button
            key={size}
            className={selectedSize === size ? "selected" : ""}
            onClick={() => setSelectedSize(size)}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="action-buttons">
        <button
          className="buy-btn"
          onClick={() => handleNext("buy")}
          disabled={isPriceLoading || basePrice == null}
        >
          {isPriceLoading ? "Загрузка..." : `Купить — ${formatRub(basePrice)}`}
        </button>
        <button
          className="preorder-btn"
          onClick={() => handleNext("preorder")}
          disabled={isPriceLoading || basePrice == null}
        >
          {isPriceLoading ? "..." : `Предзаказ — ${formatRub(preorderPrice)}`}
        </button>
      </div>
    </div>
  );
};
