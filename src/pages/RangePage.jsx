import { Banner } from "../components/Banner/Banner";
import { MainBanner } from "../components/MainBanner/MainBanner";
import fbanner from "../assets/fbanner.png";
import sbanner from "../assets/sbanner.png";

export const RangePage = () => {
  return (
    <div>
      <p className="range__text">
        <b>S&S</b> - Это не только амбициозный стартап, <br />
        но и комьюнити, стремительно набирающее обороты.
      </p>

      <MainBanner />

      <div className="range__banners">
        <Banner
          image={fbanner}
          title="Люди в черно-белом"
          text="Сидят, хорошо им наверно"
        />
        <Banner
          image={sbanner}
          title="Редактор"
          text="Как это работает и что мне делать?"
        />
      </div>
    </div>
  );
};
