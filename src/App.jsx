import { useState } from "react";
import "./App.scss";
import { Modal } from "./components/Modal/Modal";
import { Login } from "./components/Login/Login";
import { Header } from "./components/Header/Header";
import { RangePage } from "./pages/RangePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProfilePage } from "./pages/ProfilePage";
import { ReviewPage } from "./pages/ReviewPage";
import { AboutPage } from "./pages/AboutPage";
import { CreatorPage } from "./pages/CreatorPage";

function App() {
  const [modalActive, setModalActive] = useState(false);

  return (
    <>
      <BrowserRouter>
        <Header onClickHandler={() => setModalActive(!modalActive)} />
        <Routes>
          <Route path="/" element={<RangePage />} />
          <Route path="/creator" element={<CreatorPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/reviews" element={<ReviewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
        <Modal active={modalActive} setActive={setModalActive}>
          <Login onClickHandler={() => setModalActive(!modalActive)} />
        </Modal>
      </BrowserRouter>
    </>
  );
}

export default App;
