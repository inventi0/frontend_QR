import React from "react";
import "./Header.scss";
import { useLocation, useNavigate } from "react-router-dom";

export const Header = ({ onClickHandler }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: "Главная", path: "/" },
    { label: "Ассортимент", path: "/range" },
    { label: "Отзывы", path: "/reviews" },
    { label: "О бренде", path: "/about" },
    { label: "Редактор", path: "/creator" },
    { label: "Профиль", path: "/profile" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };
  return (
    <div className="header-container">
      <div className="logo">
        <svg
          width="45"
          height="45"
          viewBox="0 0 70 69"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M33.3737 39.379L35 37.7526L33.3737 36.1263L35 34.5L33.3737 32.8736L36.6263 29.621L39.879 32.8736L38.2526 34.5L39.879 36.1263L38.2526 37.7526L44.7581 44.2581L46.3844 42.6317L48.0107 44.2581L51.2634 41.0054L49.6371 39.379L51.2634 37.7526L43.1318 29.621L44.7581 27.9945L43.1318 26.3682L44.7581 24.7419L43.1318 23.1155L49.6371 16.6102L51.2634 18.2366L52.8897 16.6102L54.5162 18.2366L56.1425 16.6102L65.9006 26.3682L64.2742 27.9945L65.9006 29.621L64.2742 31.2473L65.9006 32.8736L62.6478 36.1263L59.3952 32.8736L61.0215 31.2473L59.3952 29.621L61.0215 27.9945L54.5162 21.4892L52.8897 23.1155L51.2634 21.4892L48.0107 24.7419L49.6371 26.3682L48.0107 27.9945L56.1425 36.1263L54.5162 37.7526L56.1425 39.379L54.5162 41.0054L56.1425 42.6317L49.6371 49.1371L48.0107 47.5107L46.3844 49.1371L44.7581 47.5107L43.1318 49.1371L33.3737 39.379Z"
            fill="white"
          />
          <path
            d="M7.35217 42.7419L8.97851 41.1155L7.35217 39.4892L8.97851 37.8629L7.35217 36.2366L10.6049 32.9839L13.8575 36.2366L12.2312 37.8629L13.8575 39.4892L12.2312 41.1155L18.7366 47.621L20.363 45.9947L21.9893 47.621L25.242 44.3683L23.6156 42.7419L25.242 41.1155L17.1103 32.9839L18.7366 31.3575L17.1103 29.7311L18.7366 28.1048L17.1103 26.4785L23.6156 19.9731L25.242 21.5995L26.8683 19.9731L28.4946 21.5995L30.1211 19.9731L39.879 29.7311L38.2527 31.3575L39.879 32.9839L38.2527 34.6102L39.879 36.2366L36.6264 39.4892L33.3737 36.2366L35 34.6102L33.3737 32.9839L35 31.3575L28.4946 24.8521L26.8683 26.4785L25.242 24.8521L21.9893 28.1048L23.6156 29.7311L21.9893 31.3575L30.1211 39.4892L28.4946 41.1155L30.1211 42.7419L28.4946 44.3683L30.1211 45.9947L23.6156 52.5L21.9893 50.8736L20.363 52.5L18.7366 50.8736L17.1103 52.5L7.35217 42.7419Z"
            fill="white"
          />
        </svg>
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
    </div>
  );
};
