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

const leftColumnProducts = [
  {
    id: 1,
    title: "Футболка",
    image:
      "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/tshirt.png",
    description: "Классическая футболка с вашим дизайном",
    height: 619.35,
    available: true,
  },
  {
    id: 2,
    title: "Шорты",
    image:
      "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/shorts.png",
    description: "Удобные шорты на каждый день",
    height: 937,
    available: false,
  },
];

const rightColumnProducts = [
  {
    id: 3,
    title: "Худи",
    image:
      "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/hoodie.png",
    description: "Худи для комфорта и стиля",
    height: 937,
    available: false,
  },
  {
    id: 4,
    title: "Кепки",
    image:
      "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/caps.png",
    description: "Стильная кепка с принтом",
    height: 619.35,
    available: false,
  },
];

export const AssortmentPage = ({ isAuthenticated, onLoginRequest, onRegisterRequest }) => {
  const [modalActive, setModalActive] = useState(false);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(null);
  const [chosenProduct, setChosenProduct] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const { data: me } = useGetMeQuery();
  const userId = me?.id;
  const { data: qrData } = useGetUserQrQuery(userId, { skip: !userId });

  const handleNext = (selectedData) => {
    setSelection({
      ...selectedData,
      productId: chosenProduct?.id || 1,
      productName: chosenProduct?.title || "Футболка",
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
    setOrderResult(null);
  };

  const openAuthInfo = () => {
    setStep(0);
    setModalActive(true);
  };

  return (
    <div className="assortment-page">
      <h1 className="assortment-title">Ассортимент</h1>

      <div className="assortment-gallery">
        <div className="left-column">
          {leftColumnProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              isComingSoon={!product.available}
              onClickHandler={() => {
                if (!product.available) return;
                if (!isAuthenticated) {
                  openAuthInfo();
                  return;
                }
                setChosenProduct(product);
                setModalActive(true);
                setStep(1);
              }}
            />
          ))}
        </div>
        <div className="right-column">
          {rightColumnProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              isComingSoon={!product.available}
            />
          ))}
        </div>
      </div>

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
        {step === 1 && (
          <ShirtSelection
            onNext={handleNext}
            onClose={handleClose}
            productId={chosenProduct?.id || 1}
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
