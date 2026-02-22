import { useState } from "react";
import "./Order.scss";
import { useGetProductQuery } from "../../api/productApi";
import { formatRub } from "../../utils/money";

export const ShirtSelection = ({ onNext, onClose, productId }) => {
  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("M");

  const { data: product, isLoading: isPriceLoading } = useGetProductQuery(productId, {
    skip: !productId,
  });
  const basePrice = product?.price;
  const preorderPrice = basePrice != null ? Math.round(basePrice * 0.8) : null;

  const getShirtImage = () => {
    return selectedColor === "white"
      ? "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/white.png"
      : "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/black.png";
  };

  const handleNext = (type) => {
    onNext({
      tshirtImage: getShirtImage(),
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
            src="https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/white.png"
            alt="Белая футболка"
          />
        </div>
        <div
          className={`shirt-box ${selectedColor === "black" ? "active" : ""}`}
          onClick={() => setSelectedColor("black")}
        >
          <img
            src="https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/black.png"
            alt="Чёрная футболка"
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
