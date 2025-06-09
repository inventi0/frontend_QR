import { useState } from "react";
import whiteShirt from "../../assets/white.png";
import blackShirt from "../../assets/black.png";
import "./order.scss";

export const ShirtSelection = ({ onNext }) => {
  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedPrint, setSelectedPrint] = useState(1);

  const getShirtImage = () => {
    return selectedColor === "white" ? whiteShirt : blackShirt;
  };

  const handleNext = (type) => {
    onNext({
      tshirtImage: getShirtImage(),
      size: selectedSize,
      print: selectedPrint,
      type,
    });
  };

  return (
    <div className="shirt-selection">
      <h2>Отлично, теперь выберем футболку</h2>
      <div className="shirt-options">
        <div
          className={`shirt-box ${selectedColor === "white" ? "active" : ""}`}
          onClick={() => setSelectedColor("white")}
        >
          <img src={whiteShirt} alt="Белая футболка" />
        </div>
        <div
          className={`shirt-box ${selectedColor === "black" ? "active" : ""}`}
          onClick={() => setSelectedColor("black")}
        >
          <img src={blackShirt} alt="Черная футболка" />
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

      <div className="print-select">
        <p>Принт</p>
        {[1, 2].map((n) => (
          <button
            key={n}
            className={selectedPrint === n ? "selected" : ""}
            onClick={() => setSelectedPrint(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="action-buttons">
        <button className="buy-btn" onClick={() => handleNext("buy")}>
          КУПИТЬ
        </button>
        <button className="preorder-btn" onClick={() => handleNext("preorder")}>
          ПРЕДЗАКАЗ
        </button>
      </div>
    </div>
  );
};
