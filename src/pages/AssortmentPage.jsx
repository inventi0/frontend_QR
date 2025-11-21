import React, { useState } from "react";
import { ProductCard } from "../components/ProductCard/ProductCard";
import "./AssortmentPage.scss";
import { Modal } from "../components/Modal/Modal";
import { ShirtSelection } from "../components/Order/ShirtSelection";
import { OrderForm } from "../components/Order/OrderForm";
import "../components/Auth/AuthModal.scss";
import { useGetMeQuery } from "../api/authApi";
import { useGetUserQrQuery } from "../api/accountApi";

const leftColumnProducts = [
  {
    id: 1,
    title: "Футболка",
    image:
      "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/tshirt.png",
    description: "Сидят, хорошо им наверное",
    height: 619.35,
    available: true,
  },
  {
    id: 2,
    title: "Шорты",
    image:
      "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/shorts.png",
    description: "Стоят, хорошо им наверное",
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
    description: "Стоят, хорошо им наверное",
    height: 937,
    available: false,
  },
  {
    id: 4,
    title: "Кепки",
    image:
      "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/caps.png",
    description: "Сидят, хорошо им наверное",
    height: 619.35,
    available: false,
  },
];

export const AssortmentPage = ({ isAuthenticated, onLoginRequest, onRegisterRequest }) => {
  const [modalActive, setModalActive] = useState(false);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(null);
  const [chosenProduct, setChosenProduct] = useState(null);
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
                setModalActive(!modalActive);
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

      <Modal active={modalActive} setActive={setModalActive}>
        {step === 0 && (
          <div className="auth-modal">
            <div className="auth-card">
              <h1 className="auth-title">Нужна авторизация</h1>
              <p className="auth-subtitle">
                Войдите или зарегистрируйтесь, чтобы оформить заказ на футболку.
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
        {step === 1 && <ShirtSelection onNext={handleNext} />}
        {step === 2 && selection && (
          <OrderForm
            selected={selection}
            isPreorder={selection.type === "preorder"}
            onSuccess={() => setModalActive(false)}
          />
        )}
      </Modal>
    </div>
  );
};
