import { MainBanner } from "../components/MainBanner/MainBanner";
import { UsageScenarios } from "../components/UsageScenarious/UsageScenarios";
import { useNavigate } from "react-router-dom";

export const MainPage = () => {
  const navigate = useNavigate();

  const handleBuyClick = () => {
    navigate("/range");
  };

  return (
    <div>
      <p className="range__text" style={{ marginTop: '40px' }}>
        <b>S&S</b> - Это не только амбициозный стартап, <br />
        но и комьюнити, стремительно набирающее обороты.
      </p>

      <MainBanner onClickHandler={handleBuyClick} />

      <UsageScenarios />
    </div>
  );
};

// ✅ Default export для lazy loading
export default MainPage;
