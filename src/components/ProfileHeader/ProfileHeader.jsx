import React, { useState } from "react";
import "./ProfileHeader.scss";
import avatar from "../../assets/avatar.png";
import Copy from "../icons/Copy";

const ProfileHeader = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);

    setTimeout(() => setCopied(false), 500);
  };
  return (
    <div className="profile-header">
      <div className="profile-info">
        <img
          src={
            "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/Avatar.png"
          }
          alt="avatar"
          className="avatar"
        />
        <div>
          <h1>Абдурахман</h1>
          <p>Карточки: 3</p>
        </div>
      </div>
      <div className="profile-actions">
        <button
          className="profile-id"
          onClick={() => handleCopy("0xc0E3...B79C")}
        >
          <Copy />
          {copied ? "Скопировано!" : "0xc0E3...B79C"}
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
