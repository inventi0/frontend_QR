import { UsageCard } from "./UsageCard";
import "./UsageScenarios.scss";
import editorImg from "../../assets/editor.png";
import coupleImg from "../../assets/couple.png";
import shirtImg from "../../assets/shirt.png";
import questionImg from "../../assets/question.png";


export const UsageScenarios = () => {
  return (
    <div className="usage-scenarios">
      <h2 className="usage-scenarios__title">
        Сценарии <br /> использования
      </h2>
      <div className="usage-scenarios__columns">
        <div className="usage-scenarios__column">
          <UsageCard
            title="Кастомизируй одежду"
            text="Создавай уникальные дизайны"
            image={editorImg}
          />
          <UsageCard
            title="Парные футболки"
            text="Привяжи один дизайн к двум QR-кодам, чтобы быть на одной волне"
            image={coupleImg}
          />
        </div>
        <div className="usage-scenarios__column">
          <UsageCard
            title="Отличный подарок"
            text="Просто подари с базовым дизайном, а получатель сам поменяет его на свой вкус"
            image={shirtImg}
          />
          <UsageCard
            title="Что угодно!"
            text="Оставь ссылки на соцсети, контакты, любимое видео или спрячь тайное послание"
            image={questionImg}
          />
        </div>
      </div>
    </div>
  );
};
