import "./MainBanner.scss";
import tshirtImg from "../../assets/tshirt_mockup.png";
import { TbQrcode } from "react-icons/tb";

export const MainBanner = ({ onClickHandler }) => {
  return (
    <>
      <div className="hero">
        <div className="hero__content">
          <div className="hero__label">INITIATING SEQUENCE_</div>
          <h1 className="hero__title">
            <span className="hero__title-line">Qreate</span>
            <span className="hero__title-line hero__title-line--accent">space</span>
          </h1>
          <p className="hero__desc">
            Привяжи к футболке свой Instagram, любимый мем или ссылку на
            проект. Меняй контент прямо с телефона в любой момент. Твой месседж
            — твои правила.
          </p>
          <div className="hero__actions">
            <button className="btn-primary" onClick={() => onClickHandler()}>
              КУПИТЬ
            </button>
            <div className="hero__status">
              <div className="hero__status-row">
                <span className="hero__status-prompt">&gt;</span>
                <span className="hero__status-text">SYSTEM.READY</span>
              </div>
              <div className="hero__status-row">
                <span className="hero__status-prompt">&gt;</span>
                <span className="hero__status-text hero__status-text--active">
                  AWAITING_INPUT
                  <span className="hero__blink">_</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__image-wrap">
            <img src={tshirtImg} alt="QR T-Shirt" className="hero__image" />

            <div className="hero__scan-line"></div>

            <div className="hero__corner hero__corner--tl"></div>
            <div className="hero__corner hero__corner--tr"></div>
            <div className="hero__corner hero__corner--bl"></div>
            <div className="hero__corner hero__corner--br"></div>

            <div className="hero__qr-badge">
              <TbQrcode className="hero__qr-icon" />
              <span>READY</span>
            </div>

            <div className="hero__live-badge">
              <span className="hero__live-dot"></span>
              <span>LIVE_SYS_FEED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__ticker">
        <div className="hero__ticker-track">
          <span>ОДНА ФУТБОЛКА — ТЫСЯЧИ СМЫСЛОВ +++</span>
          <span>МЕНЯЙ КОНТЕНТ В ЛЮБОЙ МОМЕНТ +++</span>
          <span>УНИКАЛЬНЫЙ QR НА КАЖДОЙ ВЕЩИ +++</span>
          <span>ПРИВЯЖИ СВОЙ ПРОФИЛЬ К QR +++</span>
          <span>ОДНА ФУТБОЛКА — ТЫСЯЧИ СМЫСЛОВ +++</span>
          <span>МЕНЯЙ КОНТЕНТ В ЛЮБОЙ МОМЕНТ +++</span>
          <span>УНИКАЛЬНЫЙ QR НА КАЖДОЙ ВЕЩИ +++</span>
          <span>ПРИВЯЖИ СВОЙ ПРОФИЛЬ К QR +++</span>
        </div>
      </div>
    </>
  );
};
