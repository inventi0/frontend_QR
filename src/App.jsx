import { useState } from "react";
import "./App.scss";
import { Modal } from "./components/Modal/Modal";
import { Login } from "./components/Login/Login";

function App() {
  const [modalActive, setModalActive] = useState(false);

  return (
    <>
      <button onClick={() => setModalActive(!modalActive)}>нажми</button>
      <Modal active={modalActive} setActive={setModalActive}>
        <Login onClickHandler={() => setModalActive(!modalActive)} />
      </Modal>
    </>
  );
}

export default App;
