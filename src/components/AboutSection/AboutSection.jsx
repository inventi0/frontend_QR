import React, { useState } from "react";
import "./AboutSection.scss";

export const AboutSection = () => {
  const [expandedCard, setExpandedCard] = useState(0);

  const toggleCard = (index) => {
    setExpandedCard(index);
  };

  const features = [
    {
      title: "Редактор дизайнов",
      shortText: "Создавайте уникальные принты в удобном онлайн-редакторе",
      fullText: "Наш интуитивный редактор позволяет создавать дизайны любой сложности. Добавляйте текст, изображения, QR-коды и другие элементы. Всё просто и удобно — от идеи до готового принта."
    },
    {
      title: "QR-коды",
      shortText: "Интегрируйте интерактивные QR-коды в ваши дизайны",
      fullText: "Размещайте QR-коды, которые могут вести на ваши соцсети, портфолио или любую другую информацию. Сделайте вашу одежду не просто стильной, но и функциональной."
    },
    {
      title: "Качественная печать",
      shortText: "Печатаем ваши дизайны на качественной одежде",
      fullText: "Мы используем современные технологии печати и качественные материалы. Ваши дизайны будут яркими, стойкими и долговечными. Каждая футболка — это произведение искусства."
    }
  ];

  return (
    <section className="about-section">
      <div className="about-container">
        <h2 className="about-title">О проекте</h2>
        <div className="about-content">
          <p>
            <strong>Scan & Style</strong> — это инновационная платформа для персонализации одежды,
            которая позволяет вам создавать уникальные дизайны с использованием QR-кодов и
            современного редактора.
          </p>
          <p>
            Мы объединяем технологии и творчество, чтобы каждый мог выразить свою
            индивидуальность через одежду. Создавайте, делитесь и носите свои уникальные дизайны!
          </p>
        </div>
        <div className="about-features">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature-card ${expandedCard === index ? 'expanded' : ''}`}
              onClick={() => toggleCard(index)}
            >
              <h3>{feature.title}</h3>
              <p className="feature-short">
                {expandedCard === index ? feature.fullText : feature.shortText}
              </p>
              <button className="feature-toggle" aria-label={expandedCard === index ? "Свернуть" : "Развернуть"}>
                {expandedCard === index ? '−' : '+'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
