import "./UsageScenarios.scss";
import editorImg from "../../assets/editor.png";
import coupleImg from "../../assets/couple.png";
import questionImg from "../../assets/question.png";

const scenarios = [
  {
    id: "UC1",
    mode: "MODE: NETWORKING",
    modeAccent: "lime",
    image: editorImg,
    title: "Знакомства & Нетворкинг",
    text: "Привяжи Telegram или Instagram — больше никаких бумажных визиток. Один сканирующий взгляд, и вы на связи.",
    dataLabel: "DATA: SOCIAL_MEDIA",
    status: "STATUS: ACTIVE",
    statusAccent: "lime",
    clip: "clip-br",
  },
  {
    id: "UC2",
    mode: "MODE: HIDDEN_PAYLOAD",
    modeAccent: "purple",
    image: coupleImg,
    title: 'Послание "Для своих"',
    text: "Загрузи локальный мем, смешное видео или фото, которое поймут только свои на тусовке.",
    dataLabel: "DATA: LOCAL_MEMES",
    status: "STATUS: LOCKED",
    statusAccent: "purple",
    clip: "clip-tl",
  },
  {
    id: "UC3",
    mode: "MODE: INFINITE_ROUTING",
    modeAccent: "white",
    image: questionImg,
    title: "Абсолютная Свобода",
    text: "Сегодня плейлист в Spotify, завтра — ссылка на новый проект или стартап. Содержимое меняется за 5 секунд, а футболка остаётся прежней.",
    dataLabel: "DATA: ANY_LINK",
    status: "STATUS: DYNAMIC",
    statusAccent: "white",
    clip: "clip-br",
  },
];

export const UsageScenarios = () => {
  return (
    <section className="usage-scenarios">
      <div className="usage-scenarios__header">
        <div className="usage-scenarios__tag">Variants Detected</div>
        <h2 className="usage-scenarios__title">
          <span className="usage-scenarios__section-num">03 //</span>
          Сценарии Использования
        </h2>
      </div>

      <div className="usage-scenarios__grid">
        {scenarios.map((sc) => (
          <div key={sc.id} className={`scenario-card scenario-card--${sc.modeAccent}`}>
            <div className="scenario-card__image-wrap">
              <img src={sc.image} alt={sc.title} className="scenario-card__image" />
              <div className="scenario-card__image-overlay"></div>
              <span className={`scenario-card__mode scenario-card__mode--${sc.modeAccent}`}>
                [{sc.mode}]
              </span>
            </div>

            <div className="scenario-card__body">
              <h3 className="scenario-card__title">{sc.title}</h3>
              <p className="scenario-card__text">{sc.text}</p>
              <div className="scenario-card__footer">
                <span className="scenario-card__data">{sc.dataLabel}</span>
                <span className={`scenario-card__status scenario-card__status--${sc.statusAccent}`}>
                  {sc.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
