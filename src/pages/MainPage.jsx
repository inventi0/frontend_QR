import { MainBanner } from "../components/MainBanner/MainBanner";
import { HowItWorks } from "../components/HowItWorks/HowItWorks";
import { UserPath } from "../components/UserPath/UserPath";
import { UsageScenarios } from "../components/UsageScenarious/UsageScenarios";
import "./MainPage.scss";
import { useNavigate } from "react-router-dom";

export const MainPage = () => {
  const navigate = useNavigate();

  const handleBuyClick = () => {
    navigate("/range");
  };

  return (
    <div className="main-page">
      <MainBanner />
      <HowItWorks />
      <UserPath />
      <UsageScenarios />

      <section className="main-cta">
        <div className="main-cta__glow" />
        <div className="main-cta__tag">Ready to Deploy</div>
        <h2 className="main-cta__title">
          <span className="main-cta__num">04 //</span>
          Твой QR — Твои Правила
        </h2>
        <p className="main-cta__desc">
          Один заказ. Бесконечные возможности.
        </p>
        <button className="main-cta__btn" onClick={handleBuyClick}>
          КУПИТЬ
        </button>
        <div className="main-cta__status">
          <span>&gt; SYSTEM.READY</span>
          <span>&gt; AWAITING_ORDER<span className="main-cta__blink">_</span></span>
        </div>
      </section>
    </div>
  );
};

export default MainPage;
