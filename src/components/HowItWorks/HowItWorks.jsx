import { TbShirt, TbQrcode, TbDeviceMobile } from "react-icons/tb";
import "./HowItWorks.scss";

const cards = [
  {
    id: "L1",
    icon: TbShirt,
    tag: "TYPE: PREMIUM_MERCH",
    title: "Премиальная База",
    text: "Oversize крой, плотный хлопок 280GSM. Футболка, которая держит форму, не просвечивает и служит долго. Основа для твоего постоянного самовыражения.",
    accent: "purple",
  },
  {
    id: "L2",
    icon: TbQrcode,
    tag: "TYPE: GENERATIVE_CODE",
    title: "Уникальный QR-арт",
    text: "Стильный QR-код, интегрированный в дизайн. Каждый принт уникален и привязан только к тебе. Считывается любой камерой смартфона мгновенно.",
    accent: "lime",
  },
  {
    id: "L3",
    icon: TbDeviceMobile,
    tag: "TYPE: DIGITAL_PROFILE",
    title: "Твоя Витрина",
    text: "Привяжи к QR-коду Instagram, любимый мем или послание для друзей. Надоело? Поменяй в пару кликов с телефона в любой момент.",
    accent: "white",
  },
];

export const HowItWorks = () => {
  return (
    <section className="how-it-works">
      <div className="how-it-works__header">
        <div>
          <span className="how-it-works__section-num">01 //</span>
          <h2 className="how-it-works__title">Как это работает?</h2>
        </div>
        <div className="how-it-works__status">
          <span className="how-it-works__status-dot"></span>
          System_Core: Online
        </div>
      </div>

      <div className="how-it-works__grid">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`how-it-works__card how-it-works__card--${card.accent} how-it-works__card--offset-${i}`}
            >
              <span className="how-it-works__card-id">{card.id}</span>
              <div className="how-it-works__card-icon">
                <Icon />
              </div>
              <h3 className="how-it-works__card-title">{card.title}</h3>
              <span className="how-it-works__card-tag">{card.tag}</span>
              <p className="how-it-works__card-text">{card.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
