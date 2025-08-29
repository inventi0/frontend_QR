import React from "react";
import "./Sidebar.scss";
import Close from "../icons/Close";

export const Sidebar = ({ isOpen, onClose, navLinks, onNavigate, onLogin, isActive}) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <button className="close-btn" onClick={onClose}>
          <Close />
        </button>
      </div>
      <nav className="sidebar-links">
        {navLinks.map((link) => (
          <button
            key={link.path}
            className={`sidebar-link ${isActive(link.path) ? "sidebar-link__active" : ""}`}
            onClick={() => onNavigate(link.path)}
          >
            {link.label}
          </button>
        ))}
        <button className="sidebar-login" onClick={onLogin}>
          Войти
        </button>
      </nav>
    </div>
  );
};
