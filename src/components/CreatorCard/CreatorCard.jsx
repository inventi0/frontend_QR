import React, { useState } from "react";
import "./CreatorCard.scss";
import avatar from "../../assets/avatar.png";
import creator from "../../assets/creator.png";
import { useNavigate } from "react-router-dom";
import Copy from "../icons/Copy";
import EyePasswordShow from "../icons/EyePasswordShow";

const CreatorPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);

    setTimeout(() => setCopied(false), 500);
  };
  return (
    <div className={`creator-card`} onClick={() => navigate("/creator")}>
      <img className="creator-image" src={creator} alt="creator" />
      <div className="creator-info">
        <div className="top-row">
          <h3>Без Названия</h3>
        </div>
        <div className="author-row">
          <img className="avatar-small" src={avatar} alt="avatar" />
          <span>Абдурахман</span>
        </div>
        <div className="bottom-row">
          <span className="bottom-row__count">
            <EyePasswordShow color="white"/> <span style={{ marginLeft: 7}}>284</span>
          </span>
          <span className="address" onClick={() => handleCopy("0xc0E3...B79C")}>
            <Copy />
            {copied ? "Скопировано!" : "0xc0E3...B79C"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreatorPage;
