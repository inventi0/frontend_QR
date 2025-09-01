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
            image={"https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/editor.png"}
            alt="Редактор"
          />
          <UsageCard
            title="Выражай свою жизненную позицию через S&S"
            text="Донесите мысль до окружающих"
            image={"https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/couple.png"}
            alt="Пара"
          />
        </div>
        <div className="usage-scenarios__column">
          <UsageCard
            title="Футболка в качестве визитки"
            text="Разместите информацию о себе и станьте самым запоминающимся"
            image={"https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/shirt.png"}
            alt="Футболка"
          />
          <UsageCard
            title="На случай если близкий потерялся"
            text="Если боитесь, что ваш родственник потеряется — укажите контакты для связи"
            image={"https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/question.png"}
            alt="Вопрос"
          />
        </div>
      </div>
    </div>
  );
};
