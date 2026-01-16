import React, { useState, useEffect } from "react";
import s from "./ReviewForm.module.scss";
import CustomInput from "../UI/CustomInput/CustomInput";

export const ReviewForm = ({ onSubmit, loading = false, errorMessage, initialData = null, isEdit = false }) => {
  const [text, setText] = useState(initialData?.content || "");
  const [stars, setStars] = useState(initialData?.stars || 5);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setText(initialData.content || "");
      setStars(initialData.stars || 5);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError(true);
      return;
    }
    const ok = await onSubmit({
      content: text.trim(),
      stars,
    });
    if (ok && !isEdit) {
      setText("");
      setStars(5);
      setError(false);
    }
  };

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <h2>{isEdit ? "Редактировать отзыв" : "Оставить отзыв"}</h2>

      <textarea
        className={s.textarea}
        placeholder="Ваш отзыв"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(false);
        }}
        minLength={5}
        required
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

      <button type="submit" disabled={loading}>
        {loading ? (isEdit ? "Сохраняем..." : "Отправляем...") : (isEdit ? "Сохранить" : "Отправить")}
      </button>

      {error && <div className={s.error}>Заполните текст отзыва</div>}
      {errorMessage && <div className={s.error}>{errorMessage}</div>}
    </form>
  );
};
