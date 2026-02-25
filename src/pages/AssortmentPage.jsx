import React, { useState } from "react";
import { ProductCard } from "../components/ProductCard/ProductCard";
import "./AssortmentPage.scss";
import { Modal } from "../components/Modal/Modal";
import { ShirtSelection } from "../components/Order/ShirtSelection";
import { OrderForm } from "../components/Order/OrderForm";
import { OrderSuccess } from "../components/Order/OrderSuccess";
import "../components/Auth/AuthModal.scss";
import { useGetMeQuery } from "../api/authApi";
import { useGetUserQrQuery } from "../api/accountApi";
import { useListProductsQuery } from "../api/productApi";
import { groupProductsByType } from "../utils/productCardMap";
import shortsImg from "../assets/shirt.png"; // Placeholder
import hoodieImg from "../assets/shirt.png"; // Placeholder
import capsImg from "../assets/caps.png";

/**
 * Planned products — teasers for items not yet on backend.
 * String IDs prevent any conflict with numeric backend IDs.
 * These cards NEVER open the purchase modal.
 */
const PLANNED_PRODUCTS = [
  {
    id: "planned-shorts",
    title: "Шорты",
    image: shortsImg,
    description: "Удобные шорты на каждый день",
  },
  {
    id: "planned-hoodie",
    title: "Худи",
    image: hoodieImg,
    description: "Худи для комфорта и стиля",
  },
  {
    id: "planned-cap",
    title: "Кепки",
    image: capsImg,
    description: "Стильная кепка с принтом",
  },
];

export const AssortmentPage = ({ isAuthenticated, onLoginRequest, onRegisterRequest }) => {
  const [modalActive, setModalActive] = useState(false);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(null);
  const [chosenProductId, setChosenProductId] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const { data: me } = useGetMeQuery();
  const userId = me?.id;
  const { data: qrData } = useGetUserQrQuery(userId, { skip: !userId });

  // Fetch real products from backend
  const {
    data: rawProducts,
    isLoading,
    isError,
    refetch,
  } = useListProductsQuery({ limit: 50, offset: 0 });

  const realProducts = groupProductsByType(rawProducts);

  // Filter out planned products whose type already exists on backend
  const realTypes = new Set(realProducts.map((p) => p.title));
  const plannedFiltered = PLANNED_PRODUCTS.filter((p) => !realTypes.has(p.title));

  const handleNext = (selectedData) => {
    setSelection({
      ...selectedData,
      productId: chosenProductId,
      qrId: qrData?.qr_id,
    });
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleOrderSuccess = (result) => {
    setOrderResult(result);
    setStep(3);
  };

  const handleClose = () => {
    setModalActive(false);
    setStep(1);
    setSelection(null);
    setChosenProductId(null);
    setOrderResult(null);
  };

  const openAuthInfo = () => {
    setStep(0);
    setModalActive(true);
  };

  return (
    <div className="assortment-page">
      <h1 className="assortment-title">Ассортимент</h1>

      {/* Loading State */}
      {isLoading && (
        <div className="assortment-loading">
          <div className="spinner-ring" />
          <p>Загружаем товары...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="assortment-error">
          <p>Не удалось загрузить товары</p>
          <button className="retry-btn" onClick={refetch}>Повторить</button>
        </div>
      )}

      {/* Products Grid (backend + planned teasers) */}
      {!isLoading && !isError && (
        <div className="assortment-grid">
          {/* Real backend products — purchasable */}
          {realProducts.map((card) => (
            <ProductCard
              key={card.id}
              title={card.title}
              image={card.image}
              description={card.description}
              isComingSoon={false}
              onClickHandler={() => {
                if (!isAuthenticated) {
                  openAuthInfo();
                  return;
                }
                setChosenProductId(card.id);
                setModalActive(true);
                setStep(1);
              }}
            />
          ))}

          {/* Planned teaser cards — NOT purchasable */}
          {plannedFiltered.map((card) => (
            <ProductCard
              key={card.id}
              title={card.title}
              image={card.image}
              description={card.description}
              isComingSoon={true}
            />
          ))}
        </div>
      )}

      {/* Empty State (no backend + no planned) */}
      {!isLoading && !isError && realProducts.length === 0 && plannedFiltered.length === 0 && (
        <div className="assortment-empty">
          <p>Пока нет товаров</p>
        </div>
      )}

      <Modal active={modalActive} setActive={handleClose}>
        {step === 0 && (
          <div className="auth-modal">
            <div className="auth-card">
              <h1 className="auth-title">Нужна авторизация</h1>
              <p className="auth-subtitle">
                Войдите или зарегистрируйтесь, чтобы оформить заказ.
              </p>
              <div className="auth-actions">
                <button
                  className="auth-submit"
                  type="button"
                  onClick={() => {
                    setModalActive(false);
                    onLoginRequest?.();
                  }}
                >
                  Войти
                </button>
                <button
                  className="auth-submit secondary"
                  type="button"
                  onClick={() => {
                    setModalActive(false);
                    onRegisterRequest?.();
                  }}
                >
                  Регистрация
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 1 && chosenProductId && (
          <ShirtSelection
            onNext={handleNext}
            onClose={handleClose}
            productId={chosenProductId}
          />
        )}
        {step === 2 && selection && (
          <OrderForm
            selected={selection}
            isPreorder={selection.type === "preorder"}
            onSuccess={handleOrderSuccess}
            onBack={handleBack}
            onClose={handleClose}
          />
        )}
        {step === 3 && (
          <OrderSuccess
            orderResult={orderResult}
            onClose={handleClose}
          />
        )}
      </Modal>
    </div>
  );
};

// ✅ Default export для lazy loading
export default AssortmentPage;
