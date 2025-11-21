import React from "react";
import "./Sidebar.scss";
import Close from "../icons/Close";

export const Sidebar = ({
  isOpen,
  onClose,
  navLinks,
  onNavigate,
  onLogin,
  onRegister,
  onLogout,
  isActive,
  isAuthenticated,
}) => {
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
            className={`sidebar-link ${
              isActive(link.path) ? "sidebar-link__active" : ""
            }`}
            onClick={() => onNavigate(link.path)}
          >
            {link.label}
          </button>
        ))}
        <div className="sidebar-actions">
          {!isAuthenticated ? (
            <>
              <button className="sidebar-action" onClick={onRegister}>
                Регистрация
              </button>
              <button className="sidebar-action" onClick={onLogin}>
                Войти
              </button>
            </>
          ) : (
            <button className="sidebar-action" onClick={onLogout}>
              Выйти
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};
