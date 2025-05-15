import React from "react";
import "./MainBanner.scss";

export const MainBanner = () => {
  return (
    <div className="scan-and-style-container">
      <div className="text-block">
        <h1>
          SCAN AND
          <br />
          STYLE
        </h1>
      </div>
      <div className="buttons">
        <button className="btn-primary">КУПИТЬ</button>
        <button className="btn-primary" style={{ backgroundColor: " #444" }}>
          ПРЕДЗАКАЗ
        </button>
      </div>
    </div>
  );
};
