import "./Banner.scss";

export const Banner = ({ image, title, text }) => {
  return (
    <div className="banner-container">
      <img src={image} />
      <div className="banner-info">
        <h3 className="banner-title">{title}</h3>
        <div className="banner-text">{text}</div>
      </div>
    </div>
  );
};
