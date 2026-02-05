import React, { useState } from "react";
import "./Footer.scss";
import { faqData } from "../../utils/data";
import Phone from "../icons/Phone";
import Home from "../icons/Home";
import Mail from "../icons/Mail";
export const Footer = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="footer">
      <form className="footer__form">
        <input type="text" placeholder="Ваше имя" />
        <input type="email" placeholder="Почта" />
        <textarea placeholder="Ваш вопрос*" />
        <button type="submit">Задать свой вопрос</button>
      </form>

      <div className="footer__faq">
        <h2>Частые вопросы</h2>
        {faqData.map((item, index) => (
          <div
            className={`faq-item ${openIndex === index ? "open" : ""}`}
            key={index}
          >
            <div
              className="faq-question"
              onClick={() => toggleAccordion(index)}
            >
              <span>{item.question}</span>
              <svg
                className={`arrow ${openIndex === index ? "rotated" : ""}`}
                width="20"
                height="14"
                viewBox="0 0 20 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18.4983 4.1102C19.0515 3.55695 19.0515 2.65996 18.4983 2.10671C17.945 1.55347 17.0481 1.55347 16.4948 2.10672L12.8267 5.77481C11.4934 7.10814 10.8267 7.77481 9.99832 7.77481C9.16989 7.77482 8.50322 7.10815 7.16989 5.77481L3.50179 2.10672C2.94854 1.55347 2.05156 1.55347 1.49831 2.10672C0.945073 2.65996 0.945074 3.55694 1.49832 4.11019L7.16989 9.78176C8.50322 11.1151 9.16989 11.7818 9.99832 11.7818C10.8267 11.7818 11.4934 11.1151 12.8267 9.78176L18.4983 4.1102Z"
                    fill="#3A3A3B"
                  />
                </g>
                <defs>
                  <clipPath id="clip0">
                    <rect
                      width="20"
                      height="13"
                      fill="white"
                      transform="translate(0 0.21875)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="faq-answer">{item.answer}</div>
          </div>
        ))}

        <div className="footer__contacts">
          <h3>Контакты</h3>
          <p>
            Если у вас возникли вопросы, жалобы, пожелания или просто хотите
            выйти на связь — заполните контактную форму или выберите удобный для
            вас способ связи
          </p>
          <a href="tel:79879458456">
            <Phone /> +7(987)-945-84-56
          </a>
          <a href="https://yandex.ru/maps/geo/moskva/53000094/?ll=37.385272%2C55.584227&z=9.52">
            <Home /> г. Москва
          </a>
          <a href="mailto:Eduard_III@mail.ru">
            <Mail />
            Eduard_III@mail.ru
          </a>
          <a href="/offer" target="_blank" rel="noopener noreferrer" className="footer__offer">
            Публичная оферта
          </a>
        </div>
      </div>
    </div>
  );
};
