import React, { useState } from "react";
import s from "./ReviewForm.module.scss";
import CustomInput from "../UI/CustomInput/CustomInput";

export const ReviewForm = ({ onSubmit }) => {
  const [user, setUser] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user.trim() || !text.trim()) {
      setError(true);
      return;
    }
    onSubmit({
      user,
      text,
      stars,
      avatarUrl: null,
      variant: "default",
    });
    setUser("");
    setText("");
    setStars(5);
    setError(false);
  };

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <h2>Оставить отзыв</h2>

      <CustomInput
        type="text"
        placeholder="Ваше имя"
        value={user}
        onChange={(e) => {
          setUser(e.target.value);
          setError(false);
        }}
      />

      <textarea
        className={s.textarea}
        placeholder="Ваш отзыв"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(false);
        }}
      />

      <div className={s.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={star <= stars ? s.starActive : s.star}
            onClick={() => setStars(star)}
          >
            ★
          </button>
        ))}
      </div>

      <button type="submit">Отправить</button>

      {error && <div className={s.error}>Все поля должны быть заполнены</div>}
    </form>
  );
};
