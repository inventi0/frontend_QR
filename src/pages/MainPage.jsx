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
      <MainBanner onClickHandler={handleBuyClick} />
      <HowItWorks />
      <UserPath />
      <UsageScenarios />
    </div>
  );
};

export default MainPage;
