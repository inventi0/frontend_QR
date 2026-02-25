import React, { useState } from "react";
import "./CreatorCard.scss";
import { useNavigate } from "react-router-dom";
import creatorImg from "../../assets/creator.png";
import avatarImg from "../../assets/Avatar.png";
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
      <img
        className="creator-image"
        src={
          creatorImg
        }
        alt="creator"
      />
      <div className="creator-info">
        <div className="top-row">
          <h3>Без Названия</h3>
        </div>
        <div className="author-row">
          <img
            className="avatar-small"
            src={
              avatarImg
            }
            alt="avatar"
          />
          <span>Абдурахман</span>
        </div>
        <div className="bottom-row">
          <span className="bottom-row__count">
            <EyePasswordShow color="white" />{" "}
            <span style={{ marginLeft: 7 }}>284</span>
          </span>
          <span className="address" onClick={() => handleCopy("1")}>
            <Copy />
            {copied ? "Скопировано!" : "1"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreatorPage;
