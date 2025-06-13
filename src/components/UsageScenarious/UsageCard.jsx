import "./UsageScenarios.scss";

export const UsageCard = ({ title, text, image, alt, style }) => {
  return (
    <div className="usage-card" style={style}>
      <div className="usage-card__content">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {image && <img src={image} alt={alt} />}
    </div>
  );
};
