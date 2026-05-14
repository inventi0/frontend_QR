import {
  TbUserEdit,
  TbShirt,
  TbBox,
  TbQrcode,
  TbAdjustmentsHorizontal,
  TbArrowRight,
  TbArrowDown,
} from "react-icons/tb";
import "./UserPath.scss";

const steps = [
  { icon: TbUserEdit,              label: "Регистрация",  num: "01" },
  { icon: TbShirt,                 label: "Заказ",        num: "02" },
  { icon: TbBox,                   label: "Получение",    num: "03" },
  { icon: TbQrcode,                label: "Активация",    num: "04" },
  { icon: TbAdjustmentsHorizontal, label: "Настройка",    num: "05" },
];

export const UserPath = () => {
  return (
    <div className="user-path">
      <div className="user-path__header">
        <div>
          <span className="user-path__section-num">02 //</span>
          <h2 className="user-path__title">
            Путь<br />Пользователя.
          </h2>
        </div>
        <p className="user-path__subtitle">
          Заказ → Получение → Настройка профиля
        </p>
      </div>

      <div className="user-path__flow-container">
        <div className="user-path__flow">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="user-path__item">
                <div className="user-path__step">
                  <span className="user-path__step-num">{step.num}</span>
                  <div className="user-path__icon">
                    <Icon />
                  </div>
                  <p className="user-path__label">{step.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <>
                    <TbArrowRight className="user-path__arrow user-path__arrow--h" />
                    <TbArrowDown className="user-path__arrow user-path__arrow--v" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
