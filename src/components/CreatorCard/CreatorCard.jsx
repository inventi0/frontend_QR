import React, { useState } from "react";
import "./CreatorCard.scss";
import avatar from "../../assets/avatar.png";
import creator from "../../assets/creator.png";
import { useNavigate } from "react-router-dom";

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
          <span>👁 284</span>
          <span className="address" onClick={() => handleCopy("0xc0E3...B79C")}>
            {" "}
            <svg
              width="24"
              height="23"
              viewBox="0 0 24 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M7.78125 4.01562C7.78125 3.6273 8.09605 3.3125 8.48438 3.3125H19.7344C20.1227 3.3125 20.4375 3.6273 20.4375 4.01562V15.2656C20.4375 15.6539 20.1227 15.9688 19.7344 15.9688H15.5156C15.1273 15.9688 14.8125 15.6539 14.8125 15.2656C14.8125 14.8773 15.1273 14.5625 15.5156 14.5625H19.0312V4.71875H9.1875V8.23438C9.1875 8.6227 8.8727 8.9375 8.48438 8.9375C8.09605 8.9375 7.78125 8.6227 7.78125 8.23438V4.01562Z"
                fill="white"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.5625 8.23438C3.5625 7.84605 3.8773 7.53125 4.26562 7.53125H15.5156C15.9039 7.53125 16.2188 7.84605 16.2188 8.23438V19.4844C16.2188 19.8727 15.9039 20.1875 15.5156 20.1875H4.26562C3.8773 20.1875 3.5625 19.8727 3.5625 19.4844V8.23438ZM4.96875 8.9375V18.7812H14.8125V8.9375H4.96875Z"
                fill="white"
              />
            </svg>
            {copied ? "Скопировано!" : "0xc0E3...B79C"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreatorPage;
