import { MainBanner } from "../components/MainBanner/MainBanner";
import { useState } from "react";
import { Modal } from "../components/Modal/Modal";
import { ShirtSelection } from "../components/Order/ShirtSelection";
import { OrderForm } from "../components/Order/OrderForm";
import { UsageScenarios } from "../components/UsageScenarious/UsageScenarios";

export const MainPage = () => {
  const [modalActive, setModalActive] = useState(false);
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(null);
  const handleNext = (selectedData) => {
    setSelection(selectedData);
    setStep(2);
  };

  return (
    <div>
      <p className="range__text">
        <b>S&S</b> - Это не только амбициозный стартап, <br />
        но и комьюнити, стремительно набирающее обороты.
      </p>

      <MainBanner
        onClickHandler={() => {
          setModalActive(!modalActive);
          setStep(1);
        }}
      />

      <UsageScenarios />

      <Modal active={modalActive} setActive={setModalActive}>
        {step === 1 && <ShirtSelection onNext={handleNext} />}
        {step === 2 && selection && (
          <OrderForm
            selected={selection}
            isPreorder={selection.type === "preorder"}
          />
        )}
      </Modal>
    </div>
  );
};
