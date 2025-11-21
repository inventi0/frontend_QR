import { MainBanner } from "../components/MainBanner/MainBanner";
import { useState } from "react";
import { Modal } from "../components/Modal/Modal";
import { ShirtSelection } from "../components/Order/ShirtSelection";
import { OrderForm } from "../components/Order/OrderForm";
import { UsageScenarios } from "../components/UsageScenarious/UsageScenarios";
import "../components/Auth/AuthModal.scss";
import { useGetUserQrQuery } from "../api/accountApi";
import { useGetMeQuery } from "../api/authApi";

export const MainPage = ({
  isAuthenticated,
  onLoginRequest,
  onRegisterRequest,
}) => {
  const [modalActive, setModalActive] = useState(false);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(null);
  const { data: me } = useGetMeQuery();
  const userId = me?.id;
  const { data: qrData } = useGetUserQrQuery(userId, { skip: !userId });

  const handleNext = (selectedData) => {
    setSelection({
      ...selectedData,
      productId: 1,
      productName: "Футболка",
      qrId: qrData?.qr_id,
    });
    setStep(2);
  };

  const openPurchase = () => {
    setStep(isAuthenticated ? 1 : 0);
    setModalActive(true);
  };

  const closeAndOpenAuth = (action) => {
    setModalActive(false);
    action?.();
  };

  return (
    <div>
      <p className="range__text">
        <b>S&S</b> - Это не только амбициозный стартап, <br />
        но и комьюнити, стремительно набирающее обороты.
      </p>

      <MainBanner onClickHandler={openPurchase} />

      <UsageScenarios />

      <Modal active={modalActive} setActive={setModalActive}>
        {step === 0 && (
          <div className="auth-modal">
            <div className="auth-card">
              <h1 className="auth-title">Доступно после входа</h1>
              <p className="auth-subtitle">
                Авторизуйтесь, чтобы выбрать футболку и оформить заказ.
                После входа кнопка «Купить» будет полностью доступна.
              </p>

              <div className="auth-actions">
                <button
                  className="auth-submit"
                  type="button"
                  onClick={() => closeAndOpenAuth(onLoginRequest)}
                >
                  Войти
                </button>
                <button
                  className="auth-submit secondary"
                  type="button"
                  onClick={() => closeAndOpenAuth(onRegisterRequest)}
                >
                  Регистрация
                </button>
              </div>
            </div>
          </div>
        )}
        {step === 1 && isAuthenticated && <ShirtSelection onNext={handleNext} />}
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
