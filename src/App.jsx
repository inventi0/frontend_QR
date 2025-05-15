import { useState } from "react";
import "./App.scss";
import { Modal } from "./components/Modal/Modal";
import { Login } from "./components/Login/Login";
import { Header } from "./components/Header/Header";
import { RangePage } from "./pages/RangePage";

function App() {
  const [modalActive, setModalActive] = useState(false);

  return (
    <>
      <Header onClickHandler={() => setModalActive(!modalActive)} />
      <RangePage />
      <Modal active={modalActive} setActive={setModalActive}>
        <Login onClickHandler={() => setModalActive(!modalActive)} />
      </Modal>
    </>
  );
}

export default App;
