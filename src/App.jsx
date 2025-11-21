import React, { useState } from "react";
import "./App.scss";
import "./pages/AssortmentPage.scss";
import { Modal } from "./components/Modal/Modal";
import { Login } from "./components/Login/Login";
import { RegistrationForm } from "./components/Auth/RegistrationForm";
import { Header } from "./components/Header/Header";
import { MainPage } from "./pages/MainPage";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ProfilePage } from "./pages/ProfilePage";
import { ReviewPage } from "./pages/ReviewPage";
import { AboutPage } from "./pages/AboutPage";
import { CreatorPage } from "./pages/CreatorPage";
import "./pages/CreatorPage.module.scss";
import { Footer } from "./components/Footer/Footer";
import { AssortmentPage } from "./pages/AssortmentPage";
import { clearSession, getSession } from "./utils/session";

function App() {
  const [loginModalActive, setLoginModalActive] = useState(false);
  const [registerModalActive, setRegisterModalActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!getSession()?.accessToken
  );
  const location = useLocation();

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    window.location.reload();
  };

  const openLogin = () => {
    setRegisterModalActive(false);
    setLoginModalActive(true);
  };

  const openRegister = () => {
    setLoginModalActive(false);
    setRegisterModalActive(true);
  };

  return (
    <>
      <Header
        onLoginClick={openLogin}
        onRegisterClick={openRegister}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
      />
      <Routes>
        <Route
          path="/"
          element={
            <MainPage
              isAuthenticated={isAuthenticated}
              onLoginRequest={openLogin}
              onRegisterRequest={openRegister}
            />
          }
        />
        <Route path="/creator" element={<CreatorPage />} />
        <Route path="/editor/:publicId/creator" element={<CreatorPage />} />
        {/* <Route path="/about" element={<AboutPage />} /> */}
        <Route path="/reviews" element={<ReviewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/range"
          element={
            <AssortmentPage
              isAuthenticated={isAuthenticated}
              onLoginRequest={openLogin}
              onRegisterRequest={openRegister}
            />
          }
        />

        <Route path="*" element={<MainPage />} />
      </Routes>

      {/* футер не показываем, если мы на странице /creator */}
      {location.pathname !== "/creator" && <Footer />}

      <Modal active={loginModalActive} setActive={setLoginModalActive}>
        <Login
          onClose={() => setLoginModalActive(false)}
          onSuccess={handleLoginSuccess}
        />
      </Modal>
      <Modal active={registerModalActive} setActive={setRegisterModalActive}>
        <RegistrationForm onClose={() => setRegisterModalActive(false)} />
      </Modal>
    </>
  );
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
