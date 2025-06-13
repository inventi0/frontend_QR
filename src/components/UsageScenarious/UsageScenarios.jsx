import { UsageCard } from "./UsageCard";
import "./UsageScenarios.scss";
import imgEditor from "../../assets/editor.png";
import imgShirt from "../../assets/shirt.png";
import imgCouple from "../../assets/couple.png";
import imgQuestion from "../../assets/question.png";

export const UsageScenarios = () => {
  return (
    <div className="usage-scenarios">
      <h2 className="usage-scenarios__title">
        Сценарии <br /> использования
      </h2>
      <div className="usage-scenarios__columns">
        <div className="usage-scenarios__column">
          <UsageCard
            title="В редакторе можно добавлять что угодно"
            text="В пределах разумного. Поделитесь пользовательской картинкой!"
            image={imgEditor}
            alt="Редактор"
            style={{ transform: "rotate(-6deg)" }}
          />
          <UsageCard
            title="Выражай свою жизненную позицию через S&S"
            text="Донесите мысль до окружающих"
            image={imgCouple}
            alt="Пара"
            style={{ transform: "rotate(-3deg)" }}
          />
        </div>
        <div className="usage-scenarios__column">
          <UsageCard
            title="Футболка в качестве визитки"
            text="Разместите информацию о себе и станьте самым запоминающимся"
            image={imgShirt}
            alt="Футболка"
            style={{ transform: "rotate(5deg)" }}
          />
          <UsageCard
            title="На случай если близкий потерялся"
            text="Если боитесь, что ваш родственник потеряется — укажите контакты для связи"
            image={imgQuestion}
            alt="Вопрос"
            style={{ transform: "rotate(4deg)" }}
          />
        </div>
      </div>
    </div>
  );
};
