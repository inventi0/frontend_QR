import React, { useState } from "react";
import "./App.scss";
import "./pages/AssortmentPage.scss";
import { Modal } from "./components/Modal/Modal";
import { Login } from "./components/Login/Login";
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

function App() {
  const [modalActive, setModalActive] = useState(false);
  const location = useLocation();

  return (
    <>
      <Header onClickHandler={() => setModalActive(!modalActive)} />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/creator" element={<CreatorPage />} />
        {/* <Route path="/about" element={<AboutPage />} /> */}
        <Route path="/reviews" element={<ReviewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/range" element={<AssortmentPage />} />

        <Route path="*" element={<MainPage />} />
      </Routes>

      {/* футер не показываем, если мы на странице /creator */}
      {location.pathname !== "/creator" && <Footer />}

      <Modal active={modalActive} setActive={setModalActive}>
        <Login onClickHandler={() => setModalActive(!modalActive)} />
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
