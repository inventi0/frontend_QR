import { useState, useMemo } from "react";
import "./Order.scss";
import { useGetMeQuery } from "../../api/authApi";
import { useListUserTemplatesQuery } from "../../api/accountApi";

export const ShirtSelection = ({ onNext }) => {
  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const { data: me } = useGetMeQuery();
  const userId = me?.id;
  const { data: templates } = useListUserTemplatesQuery(
    { userId, includeGlobal: true, limit: 50, offset: 0 },
    { skip: !userId }
  );

  const templateOptions = useMemo(() => {
    if (!templates) return [];
    return templates.map((tpl) => ({
      id: tpl.id,
      name: tpl.name || `Шаблон #${tpl.id}`,
    }));
  }, [templates]);

  const getShirtImage = () => {
    return selectedColor === "white"
      ? "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/white.png"
      : "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/black.png";
  };

  const handleNext = (type) => {
    onNext({
      tshirtImage: getShirtImage(),
      size: selectedSize,
      templateId: selectedTemplateId,
      type,
    });
  };

  return (
    <div className="modal-panel shirt-selection">
      <h2>Выберите футболку и шаблон</h2>
      <div className="shirt-options">
        <div
          className={`shirt-box ${selectedColor === "white" ? "active" : ""}`}
          onClick={() => setSelectedColor("white")}
        >
          <img
            src={
              "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/white.png"
            }
            alt="Белая футболка"
          />
        </div>
        <div
          className={`shirt-box ${selectedColor === "black" ? "active" : ""}`}
          onClick={() => setSelectedColor("black")}
        >
          <img
            src={
              "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/black.png"
            }
            alt="Черная футболка"
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

      <div className="template-select">
        <p>Шаблон (принт)</p>
        {templateOptions.length > 0 ? (
          <select
            value={selectedTemplateId || ""}
            onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
          >
            <option value="">Без шаблона</option>
            {templateOptions.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="muted">Шаблонов пока нет</span>
        )}
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
