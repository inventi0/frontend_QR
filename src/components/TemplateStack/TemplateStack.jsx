import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./TemplateStack.scss";

const positionStyles = [
  { scale: 1, y: 0, blur: 0 },
  { scale: 0.98, y: 12, blur: 0 },
  { scale: 0.96, y: 24, blur: 1 },
];

const exitAnimationNext = {
  y: -500,
  scale: 0.8,
  opacity: 0,
  zIndex: 10,
};

const exitAnimationPrev = {
  y: 500,
  scale: 0.8,
  opacity: 0,
  zIndex: 10,
};

const enterAnimationNext = {
  y: 60,
  scale: 0.85,
};

const enterAnimationPrev = {
  y: -60,
  scale: 0.85,
};

function AnimatedTemplateCard({ template, index, isAnimating, direction, onEdit, onDelete, onSetActive, isActive }) {
  const { scale, y, blur } = positionStyles[index] ?? positionStyles[2];
  const zIndex = index === 0 && isAnimating ? 10 : 3 - index;

  const exitAnim = index === 0 && isAnimating 
    ? (direction === 'next' ? exitAnimationNext : exitAnimationPrev) 
    : undefined;
  const initialAnim = index === 2 
    ? (direction === 'next' ? enterAnimationNext : enterAnimationPrev) 
    : undefined;

  return (
    <motion.div
      key={template.id}
      initial={initialAnim}
      animate={{ y, scale }}
      exit={exitAnim}
      transition={{
        type: "spring",
        duration: 0.6,
        bounce: 0,
      }}
      style={{
        zIndex,
        left: "50%",
        x: "-50%",
        top: 0,
        filter: `blur(${blur}px)`,
      }}
      className="animated-template-card"
    >
      <div className="template-card-inner">
        <div className="template-thumb">
          {template.file_url ? (
            <img src={template.file_url} alt={template.name || "Шаблон"} />
          ) : (
            <div className="template-placeholder">Нет превью</div>
          )}
        </div>

        <div className="template-content">
          <div className="template-info">
            <div className="template-header">
              <h4>{template.name || `Дизайн ${template.id}`}</h4>
              {isActive && <span className="active-badge">★</span>}
            </div>
            {template.created_at && (
              <p className="template-date">
                {new Date(template.created_at).toLocaleString("ru-RU", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          
          {index === 0 && (
            <button className="read-btn" onClick={() => onEdit(template.file_url)} title="Открыть">
              Открыть
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <path d="M9.5 18L15.5 12L9.5 6" />
              </svg>
            </button>
          )}
        </div>

        {index === 0 && (
          <div className="template-actions">
            <button
              className={`set-active-btn ${isActive ? "is-active" : ""}`}
              onClick={() => onSetActive(template.id)}
              title={isActive ? "Уже активен" : "Сделать активным"}
            >
              {isActive ? "★ Активный" : "Сделать активным"}
            </button>
            <button
              className="delete-btn"
              onClick={() => onDelete(template.id)}
              title="Удалить шаблон"
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function TemplateStack({ templates, currentTemplateId, onEdit, onDelete, onSetActive }) {
  const [cards, setCards] = useState(templates.map((t, i) => ({ ...t, stackId: i })));
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('next');

  const handleNext = () => {
    if (isAnimating || cards.length === 0) return;
    
    setDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      const [first, ...rest] = cards;
      setCards([...rest, { ...first, stackId: Date.now() }]);
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isAnimating || cards.length === 0) return;
    
    setDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      const last = cards[cards.length - 1];
      const rest = cards.slice(0, -1);
      setCards([{ ...last, stackId: Date.now() }, ...rest]);
      setIsAnimating(false);
    }, 300);
  };

  // Sync with external templates prop
  useEffect(() => {
    if (templates.length !== cards.length) {
      setCards(templates.map((t, i) => ({ ...t, stackId: t.id * 1000 + i })));
    }
  }, [templates.length, cards.length]);

  const visibleCards = cards.slice(0, 3);

  return (
    <div className="template-stack-wrapper">
      <div className="template-stack-container">
        <AnimatePresence initial={false}>
          {visibleCards.map((template, index) => (
            <AnimatedTemplateCard
              key={template.stackId}
              template={template}
              index={index}
              isAnimating={isAnimating}
              direction={direction}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetActive={onSetActive}
              isActive={template.id === currentTemplateId}
            />
          ))}
        </AnimatePresence>
      </div>

      {cards.length > 1 && (
        <>
          <button onClick={handlePrev} className="prev-card-btn-arrow" title="Предыдущий шаблон">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button onClick={handleNext} className="next-card-btn-arrow" title="Следующий шаблон">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
