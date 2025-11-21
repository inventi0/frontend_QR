// src/components/Toolbar.jsx
import React from "react";
import {
  FaPen,
  FaEraser,
  FaPalette,
  FaTrashAlt,
  FaDownload,
  FaSquare,
  FaCircle,
  FaFillDrip,
  FaRegImages,
} from "react-icons/fa";
import styles from "./Toolbar.module.scss";

// Basic color palette
const colors = [
  "#FFFFFF",
  "#C1C1C1",
  "#EF130B",
  "#FF7100",
  "#FFE400",
  "#00CC00",
  "#00B2FF",
  "#231FD3",
  "#A300BA",
  "#FF00FF",
  "#000000",
  "#5a2d00", // Example basic + custom
];

function Toolbar({
  selectedColor,
  setSelectedColor,
  lineWidth,
  setLineWidth,
  selectedTool,
  setSelectedTool,
  clearCanvas,
  downloadImage,
  onImportImage,
  onSaveTemplate,
  savingTemplate,
  templateOptions = [],
  onLoadTemplateFromCloud,
  isReadOnly = false,
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolSection}>
        <button
          title="Ручка"
          className={`${styles.toolButton} ${
            selectedTool === "pen" ? styles.active : ""
          }`}
          onClick={() => setSelectedTool("pen")}
        >
          <FaPen />
        </button>
        <button
          title="Ластик"
          className={`${styles.toolButton} ${
            selectedTool === "eraser" ? styles.active : ""
          }`}
          onClick={() => setSelectedTool("eraser")}
        >
          <FaEraser />
        </button>
        <button
          title="Заливка"
          className={`${styles.toolButton} ${
            selectedTool === "bucket" ? styles.active : ""
          }`}
          onClick={() => setSelectedTool("bucket")}
        >
          <FaFillDrip />
        </button>
        <button
          title="Прямоугольник" /* Title changed */
          className={`${styles.toolButton} ${
            selectedTool === "rectangle" ? styles.active : ""
          }`} /* Tool name changed */
          onClick={() => setSelectedTool("rectangle")}
        >
          <FaSquare />
        </button>
        <button
          title="Круг"
          className={`${styles.toolButton} ${
            selectedTool === "circle" ? styles.active : ""
          }`}
          onClick={() => setSelectedTool("circle")}
        >
          <FaCircle />
        </button>
        <button
          title="Перемещение изображений"
          className={`${styles.toolButton} ${
            selectedTool === "image" ? styles.active : ""
          }`}
          onClick={() => setSelectedTool("image")}
        >
          <FaRegImages />
        </button>
      </div>

      <div className={styles.toolSection}>
        <input
          type="range"
          title={`Line Width: ${lineWidth}`}
          min="1"
          max="100"
          step="1"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className={styles.lineWidthSlider}
        />
        <span className={styles.lineWidthValue}>{lineWidth}px</span>
      </div>

      <div className={styles.toolSection}>
        <input
          type="color"
          title="Свой цвет"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className={styles.colorInput}
        />
        <div className={styles.colorPalette}>
          {colors.map((color) => (
            <button
              key={color}
              title={color}
              className={`${styles.colorButton} ${
                selectedColor.toUpperCase() === color.toUpperCase()
                  ? styles.activeColor
                  : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Выбрать цвет ${color}`}
            />
          ))}
        </div>
      </div>

      <div className={`${styles.toolSection} ${styles.actionsSection}`}>
        <button
          title="Очистить"
          className={styles.actionButton}
          onClick={clearCanvas}
          disabled={isReadOnly}
        >
          <FaTrashAlt /> <span className={styles.buttonText}>Очистить</span>
        </button>
        <button
          title="Скачать изображение"
          className={styles.actionButton}
          onClick={downloadImage}
        >
          <FaDownload /> <span className={styles.buttonText}>Сохранить</span>
        </button>
        <label className={styles.actionButton}>
          <FaDownload />{" "}
          <span className={styles.buttonText}>Импортировать</span>
          <input
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportImage?.(file);
              e.target.value = "";
            }}
          />
        </label>
        <button
          title="Сохранить в шаблоны"
          className={styles.actionButton}
          onClick={onSaveTemplate}
          disabled={savingTemplate || isReadOnly}
        >
          <FaDownload />{" "}
          <span className={styles.buttonText}>
            {savingTemplate ? "Сохраняем..." : "Сохранить в шаблоны"}
          </span>
        </button>
        {templateOptions.length > 0 && (
          <select
            className={styles.templateSelect}
            defaultValue=""
            onChange={(e) => {
              const id = Number(e.target.value);
              const tpl = templateOptions.find((t) => t.id === id);
              if (tpl) onLoadTemplateFromCloud?.(tpl);
            }}
          >
            <option value="" disabled>
              Загрузить шаблон
            </option>
            {templateOptions.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

export default React.memo(Toolbar);
