import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaPen,
  FaEraser,
  FaFillDrip,
  FaSquare,
  FaCircle,
  FaRegImages,
  FaUndo,
  FaRedo,
  FaSave,
  FaTrashAlt,
  FaShapes,
  FaChevronDown,
  FaArrowsAlt,
  FaPalette,
  FaTimes
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
  "#5a2d00",
];

function Toolbar({
  selectedColor,
  setSelectedColor,
  lineWidth,
  setLineWidth,
  selectedTool,
  setSelectedTool,
  clearCanvas,
  onImportImage,
  onSaveTemplate,
  savingTemplate,
  templateOptions = [],
  onLoadTemplateFromCloud,
  isReadOnly = false,
  // Undo/Redo props
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  // Mobile Props State
  isPropsPanelOpen,
  onToggleProps
}) {
  const [showShapes, setShowShapes] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const shapesRef = useRef(null);
  const paletteRef = useRef(null);
  const propsPanelRef = useRef(null);
  const [palettePos, setPalettePos] = useState({ top: 0, left: 0 });
  const [shapesPos, setShapesPos] = useState({ top: 0, left: 0 });

  // Close shapes dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (shapesRef.current && !shapesRef.current.contains(event.target)) {
        // Also check if click is inside the portal content (handled by backdrop usually, but good for safety)
        const portal = document.getElementById('shapes-portal-content');
        if (portal && portal.contains(event.target)) return;
        setShowShapes(false);
      }

      // Click Outside logic for Properties Panel
      if (isPropsPanelOpen && propsPanelRef.current && !propsPanelRef.current.contains(event.target)) {
        // Check if click was on a tool button (which handles its own toggle)
        if (event.target.closest(`.${styles.toolButton}`)) return;
        // Check if click was on palette portal
        if (event.target.closest(`.${styles.palettePopover}`)) return;

        onToggleProps?.(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside); // Support mobile touch
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showShapes, isPropsPanelOpen, onToggleProps]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showShapes) setShowShapes(false);
        if (showPalette) setShowPalette(false);
        if (isPropsPanelOpen) onToggleProps?.(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showShapes, showPalette, isPropsPanelOpen, onToggleProps]);

  // Calculate Palette Position for Portal
  useLayoutEffect(() => {
    if (showPalette && paletteRef.current) {
      const rect = paletteRef.current.getBoundingClientRect();
      const popoverWidth = 220;
      const popoverHeight = 160;

      let top = rect.top - popoverHeight - 10;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;

      if (left < 10) left = 10;
      if (left + popoverWidth > window.innerWidth) left = window.innerWidth - popoverWidth - 10;
      if (top < 10) top = rect.bottom + 10;

      setPalettePos({ top, left });
    }
  }, [showPalette]);

  // Calculate Shapes Position for Portal
  useLayoutEffect(() => {
    if (showShapes && shapesRef.current) {
      const rect = shapesRef.current.getBoundingClientRect();
      const popoverWidth = 160;

      // Position above on mobile (if toolbar at bottom), below on desktop (if toolbar at top)
      // Usually smart positioning is needed. Let's assume bottom toolbar -> show above.
      const isBottomToolbar = rect.top > window.innerHeight / 2;

      let top = isBottomToolbar ? rect.top - 100 : rect.bottom + 10; // Approx height
      let left = rect.left;

      // Adjust logic
      if (isBottomToolbar) {
        top = rect.top - 80 - 10; // Height of dropdown approx + gap
      }

      // Keep within bounds
      if (left + popoverWidth > window.innerWidth) left = window.innerWidth - popoverWidth - 10;

      setShapesPos({ top, left });
    }
  }, [showShapes]);


  const handleToolSelect = (tool) => {
    if (selectedTool === tool && !isPropsPanelOpen) {
      onToggleProps?.(true);
    } else if (selectedTool !== tool) {
      setSelectedTool(tool);
      onToggleProps?.(true);
    }



    if (tool === 'rectangle' || tool === 'circle') {
      setShowShapes(false);
    }
  };

  const isShapeActive = selectedTool === 'rectangle' || selectedTool === 'circle';
  const showColorControls = selectedTool !== 'eraser';
  const showThicknessControls = selectedTool !== 'bucket';

  // Tool Name Helper
  const getToolName = () => {
    switch (selectedTool) {
      case 'pen': return 'Ручка';
      case 'eraser': return 'Ластик';
      case 'bucket': return 'Заливка';
      case 'rectangle': return 'Прямоугольник';
      case 'circle': return 'Круг';
      case 'image': return 'Перемещение';
      default: return 'Инструмент';
    }
  };

  return (
    <div className={styles.toolbarContainer}>

      {/* TOOLS WRAPPER */}
      <div className={styles.toolsWrapper}>

        {/* LEFT: Tools */}
        <div className={styles.glassPanel}>
          <div className={styles.leftGroup}>
            <button
              title="Ручка"
              className={`${styles.toolButton} ${selectedTool === "pen" ? styles.active : ""}`}
              onClick={() => handleToolSelect("pen")}
              style={{ color: selectedTool === "pen" ? selectedColor : undefined }}
            >
              <FaPen />
              <span className={styles.toolLabel}>Ручка</span>
            </button>
            <button
              title="Ластик"
              className={`${styles.toolButton} ${selectedTool === "eraser" ? styles.active : ""}`}
              onClick={() => handleToolSelect("eraser")}
            >
              <FaEraser />
              <span className={styles.toolLabel}>Ластик</span>
            </button>
            <button
              title="Заливка"
              className={`${styles.toolButton} ${selectedTool === "bucket" ? styles.active : ""}`}
              onClick={() => handleToolSelect("bucket")}
              style={{ color: selectedTool === "bucket" ? selectedColor : undefined }}
            >
              <FaFillDrip />
              <span className={styles.toolLabel}>Заливка</span>
            </button>

            <div className={styles.separator} />

            {/* Shapes Dropdown Trigger */}
            <div className={styles.shapesWrapper} ref={shapesRef}>
              <button
                title="Фигуры"
                className={`${styles.toolButton} ${isShapeActive ? styles.active : ""}`}
                onClick={() => setShowShapes(!showShapes)}
              >
                <FaShapes />
                <span className={styles.toolLabel}>Фигуры</span>
                <FaChevronDown size={10} style={{ marginLeft: 4 }} />
              </button>

              {/* Shapes Portal */}
              {showShapes && createPortal(
                <div
                  className={styles.shapesPopover}
                  id="shapes-portal-content"
                  style={{
                    position: 'fixed',
                    top: shapesPos.top,
                    left: shapesPos.left,
                    zIndex: 10001 // Above everything
                  }}
                >
                  <button
                    className={selectedTool === "rectangle" ? styles.active : ""}
                    onClick={() => handleToolSelect("rectangle")}
                  >
                    <FaSquare /> <span>Прямоугольник</span>
                  </button>
                  <button
                    className={selectedTool === "circle" ? styles.active : ""}
                    onClick={() => handleToolSelect("circle")}
                  >
                    <FaCircle /> <span>Круг</span>
                  </button>
                  {/* Backdrop */}
                  <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
                    onClick={() => setShowShapes(false)}
                  />
                </div>,
                document.body
              )}
            </div>

            <button
              title="Перемещение"
              className={`${styles.toolButton} ${selectedTool === "image" ? styles.active : ""}`}
              onClick={() => handleToolSelect("image")}
            >
              <FaArrowsAlt />
              <span className={styles.toolLabel}>Двигать</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className={`${styles.glassPanel} ${styles.rightGroup}`}>
          {/* Import Image */}
          <label className={styles.toolButton} title="Импорт картинки">
            <FaRegImages />
            <span className={styles.toolLabel}>Фото</span>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportImage?.(file);
                e.target.value = "";
              }}
            />
          </label>

          <div className={styles.separator} />

          <button
            title="Отменить"
            className={styles.toolButton}
            onClick={onUndo}
            disabled={!canUndo}
          >
            <FaUndo />
            <span className={styles.toolLabel}>Назад</span>
          </button>
          <button
            title="Повторить"
            className={styles.toolButton}
            onClick={onRedo}
            disabled={!canRedo}
          >
            <FaRedo />
            <span className={styles.toolLabel}>Вперед</span>
          </button>

          <div className={styles.separator} />

          <button
            title="Очистить"
            className={styles.toolButton}
            onClick={clearCanvas}
            disabled={isReadOnly}
          >
            <FaTrashAlt />
            <span className={styles.toolLabel}>Сброс</span>
          </button>

          {/* Templates */}
          <div style={{ position: 'relative' }}>
            <button
              title="Загрузить из шаблонов"
              className={`${styles.actionButton} ${styles.templatesButton}`}
              onClick={() => { /* Toggle */ }}
            >
              <span>Шаблоны</span>
            </button>
            {templateOptions.length > 0 && (
              <select
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                }}
                value=""
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const tpl = templateOptions.find((t) => t.id === id);
                  if (tpl) onLoadTemplateFromCloud?.(tpl);
                }}
              >
                <option value="" disabled>Выбрать...</option>
                {templateOptions.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            )}
          </div>

          <button
            aria-label="Сохранить"
            title="Сохранить"
            className={`${styles.actionButton} ${styles.saveButton}`}
            onClick={onSaveTemplate}
            disabled={savingTemplate || isReadOnly}
          >
            <FaSave />
          </button>
        </div>

      </div>

      {/* PROPERTIES PANEL (Popover on Mobile) */}
      <div
        className={`${styles.centerGroup} ${isPropsPanelOpen ? styles.visible : ''}`}
        ref={propsPanelRef}
      >
        {/* Mobile Header */}
        <div className={styles.popoverHeader}>
          <span className={styles.popoverTitle}>{getToolName()}</span>
          <button
            className={styles.closeButton}
            onClick={() => onToggleProps?.(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.popoverBody}>
          {showThicknessControls && (
            <div className={styles.brushControls}>
              <input
                type="range"
                title={`Толщина: ${lineWidth}px`}
                min="1"
                max="50"
                step="1"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className={styles.lineWidthSlider}
              />
              <input
                type="number"
                min="1"
                max="50"
                value={lineWidth}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(50, Number(e.target.value)));
                  setLineWidth(val);
                }}
                className={styles.brushSizeInput}
              />
            </div>
          )}

          {showColorControls && (
            <>
              {/* Responsive Palette (Inline on Mobile Popover) */}
              <div className={styles.paletteWrapper} ref={paletteRef}>
                {/* Palette Button usually toggles portal, but in popover we might want inline?
                    User request: "Pencil: Color swatches + Thickness"
                    Let's keep the palette button for full spectrum, or show swatches inline.
                    Code below shows inline palette on desktop, button on mobile.
                    Let's try to show swatches inline in the popover for better UX.
                */}

                {/* Always show inline swatches in Popover mode (if width allows) */}
                <div className={styles.colorPalette}>
                  <input
                    type="color"
                    title="Свой цвет"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className={styles.colorInput}
                  />
                  {colors.slice(0, 5).map((color) => (
                    <button
                      key={color}
                      className={`${styles.colorSwatch} ${selectedColor.toUpperCase() === color.toUpperCase() ? styles.active : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={color}
                    />
                  ))}
                </div>

                {/* Palette Portal (Full Spectrum) */}
                {showPalette && createPortal(
                  <div
                    className={styles.palettePopover}
                    style={{
                      position: 'fixed',
                      top: palettePos.top,
                      left: palettePos.left,
                      zIndex: 10002
                    }}
                  >
                    <div className={styles.colorPalette}>
                      {colors.map((color) => (
                        <button
                          key={color}
                          className={`${styles.colorSwatch} ${selectedColor.toUpperCase() === color.toUpperCase() ? styles.active : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setSelectedColor(color);
                            setShowPalette(false);
                          }}
                          aria-label={color}
                        />
                      ))}
                    </div>
                    <div
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
                      onClick={() => setShowPalette(false)}
                    />
                  </div>,
                  document.body
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default React.memo(Toolbar);
