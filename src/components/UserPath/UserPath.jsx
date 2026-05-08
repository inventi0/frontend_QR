import React from "react";
import { 
  TbUserEdit, 
  TbShirt, 
  TbBox, 
  TbQrcode, 
  TbAdjustmentsHorizontal, 
  TbArrowRight 
} from "react-icons/tb";
import "./UserPath.scss";

export const UserPath = () => {
  return (
    <div className="user-path">
      <h2 className="user-path__title">
        ПУТЬ<br/>ПОЛЬЗОВАТЕЛЯ.
      </h2>
      
      <div className="user-path__flow-container">
        <div className="user-path__flow">
          
          <div className="user-path__step">
            <div className="user-path__icon">
              <TbUserEdit />
            </div>
            <p className="user-path__label">РЕГИСТРАЦИЯ</p>
          </div>
          
          <TbArrowRight className="user-path__arrow" />

          <div className="user-path__step">
            <div className="user-path__icon">
              <TbShirt />
            </div>
            <p className="user-path__label">ЗАКАЗ</p>
          </div>

          <TbArrowRight className="user-path__arrow" />

          <div className="user-path__step">
            <div className="user-path__icon">
              <TbBox />
            </div>
            <p className="user-path__label">ПОЛУЧЕНИЕ</p>
          </div>

          <TbArrowRight className="user-path__arrow" />

          <div className="user-path__step">
            <div className="user-path__icon">
              <TbQrcode />
            </div>
            <p className="user-path__label">АКТИВАЦИЯ</p>
          </div>

          <TbArrowRight className="user-path__arrow" />

          <div className="user-path__step">
            <div className="user-path__icon">
              <TbAdjustmentsHorizontal />
            </div>
            <p className="user-path__label">НАСТРОЙКА</p>
          </div>

        </div>
      </div>
    </div>
  );
};
