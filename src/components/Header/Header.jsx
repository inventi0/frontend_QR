import React, { useState } from "react";
import "./Header.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import Logo from "../icons/Logo";
import Menu from "../icons/Menu";

export const Header = ({ onClickHandler }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinks = [
    { label: "Главная", path: "/" },
    { label: "Ассортимент", path: "/range" },
    { label: "Отзывы", path: "/reviews" },
    { label: "Редактор", path: "/creator" },
    { label: "Профиль", path: "/profile" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="header-container">
        <div className="logo" onClick={() => navigate("/")}>
          <Logo />
        </div>

        <nav className="nav-links">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button className="login-button" onClick={() => onClickHandler()}>
          Войти
        </button>

        <button
          className="burger-button"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu />
        </button>
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navLinks={navLinks}
        onNavigate={(path) => {
          navigate(path);
          setIsSidebarOpen(false);
        }}
        isActive={isActive}
        onLogin={() => {
          onClickHandler();
          setIsSidebarOpen(false);
        }}
      />
    </>
  );
};
