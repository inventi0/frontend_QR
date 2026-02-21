import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaPen,
  FaEraser,
  FaFillDrip,
  FaSquare,
  FaCircle,
  FaRegImages,
  FaLayerGroup,
  FaUndo,
  FaRedo,
  FaSave,
  FaTrashAlt,
  FaShapes,
  FaChevronDown,
  FaArrowsAlt,
  FaPalette,
  FaTimes,
  FaClone,
  FaLevelUpAlt,
  FaLevelDownAlt,
  FaAngleDoubleUp,
  FaAngleDoubleDown,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaSyncAlt,
  FaAdjust,
  FaBorderAll
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
  // Mobile Props State
  isPropsPanelOpen,
  onToggleProps,
  // Image Toolkit Handlers
  activeObject,
  onApplyHelper,
  onLayerOrder,
  onDeleteObject,
  onDuplicateObject,
  onChangeOpacity,
  // Layers panel
  isLayersPanelOpen,
  onToggleLayers,
}) {
  const [showShapes, setShowShapes] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [palettePos, setPalettePos] = useState({ top: 0, left: 0 });
  const [shapesPos, setShapesPos] = useState({ top: 0, left: 0 });

  // Local state for opacity percent input
  const internalOpacity = activeObject?.opacity ?? 1;
  const initialPercent = Math.max(1, Math.min(100, Math.round(internalOpacity * 100)));
  const [opacityInput, setOpacityInput] = useState(initialPercent.toString());

  const shapesRef = useRef(null);
  const paletteRef = useRef(null);
  const propsPanelRef = useRef(null);

  // Sync internal input when external object selection / opacity changes
  useEffect(() => {
    if (activeObject) {
      const pct = Math.max(1, Math.min(100, Math.round((activeObject.opacity ?? 1) * 100)));
      setOpacityInput(pct.toString());
    }
  }, [activeObject]);

  // Handle manual input commit
  const commitOpacity = (valStr) => {
    let pct = parseInt(valStr, 10);
    if (isNaN(pct)) pct = 100;
    pct = Math.max(1, Math.min(100, pct));
    setOpacityInput(pct.toString());
    onChangeOpacity(pct / 100);
  };

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



  return (
    <div className={styles.toolbarContainer}>

      {/* TOOLS WRAPPER */}
      <div className={styles.toolsWrapper}>

        {/* LEFT: Tools */}
        <div className={styles.glassPanel}>
          <div className={styles.leftGroup}>
            <button
              title="Ручка"
              aria-label="Ручка"
              className={`${styles.toolButton} ${selectedTool === "pen" ? styles.active : ""}`}
              onClick={() => handleToolSelect("pen")}
              style={{ color: selectedTool === "pen" ? selectedColor : undefined }}
            >
              <FaPen />
              <span className={styles.iconLabel}>Ручка</span>
            </button>
            <button
              title="Ластик"
              aria-label="Ластик"
              className={`${styles.toolButton} ${selectedTool === "eraser" ? styles.active : ""}`}
              onClick={() => handleToolSelect("eraser")}
            >
              <FaEraser />
              <span className={styles.iconLabel}>Ластик</span>
            </button>
            <button
              title="Заливка"
              aria-label="Заливка"
              className={`${styles.toolButton} ${selectedTool === "bucket" ? styles.active : ""}`}
              onClick={() => handleToolSelect("bucket")}
              style={{ color: selectedTool === "bucket" ? selectedColor : undefined }}
            >
              <FaFillDrip />
              <span className={styles.iconLabel}>Заливка</span>
            </button>

            <div className={styles.separator} />

            {/* Shapes Dropdown Trigger */}
            <div className={styles.shapesWrapper} ref={shapesRef}>
              <button
                title="Фигуры"
                aria-label="Фигуры"
                className={`${styles.toolButton} ${isShapeActive ? styles.active : ""}`}
                onClick={() => setShowShapes(!showShapes)}
              >
                <FaShapes />
                <span className={styles.iconLabel}>Фигуры</span>
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
                    aria-label="Прямоугольник"
                    title="Прямоугольник"
                  >
                    <FaSquare />
                  </button>
                  <button
                    className={selectedTool === "circle" ? styles.active : ""}
                    onClick={() => handleToolSelect("circle")}
                    aria-label="Круг"
                    title="Круг"
                  >
                    <FaCircle />
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
              aria-label="Перемещение/Выбор"
              className={`${styles.toolButton} ${selectedTool === "image" ? styles.active : ""}`}
              onClick={() => handleToolSelect("image")}
            >
              <FaArrowsAlt />
              <span className={styles.iconLabel}>Двигать</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className={`${styles.glassPanel} ${styles.rightGroup}`}>
          {/* Import Image */}
          <label className={styles.toolButton} title="Импорт картинки" aria-label="Импорт картинки">
            <FaRegImages />
            <span className={styles.iconLabel}>Фото</span>
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

          <button
            title="Слои"
            aria-label="Панель слоёв"
            className={`${styles.toolButton} ${isLayersPanelOpen ? styles.activeTool : ''}`}
            onClick={onToggleLayers}
          >
            <FaLayerGroup />
            <span className={styles.iconLabel}>Слои</span>
          </button>

          <div className={styles.separator} />

          <button
            title="Отменить"
            aria-label="Отменить"
            className={styles.toolButton}
            onClick={onUndo}
            disabled={!canUndo}
          >
            <FaUndo />
            <span className={styles.iconLabel}>Назад</span>
          </button>
          <button
            title="Повторить"
            aria-label="Повторить"
            className={styles.toolButton}
            onClick={onRedo}
            disabled={!canRedo}
          >
            <FaRedo />
            <span className={styles.iconLabel}>Вперёд</span>
          </button>

          <div className={styles.separator} />

          <button
            title="Очистить"
            aria-label="Очистить холст"
            className={styles.toolButton}
            onClick={clearCanvas}
            disabled={isReadOnly}
          >
            <FaTrashAlt />
            <span className={styles.iconLabel}>Очист.</span>
          </button>

          {/* Templates */}
          <div style={{ position: 'relative' }}>
            <button
              title="Загрузить из шаблонов"
              className={`${styles.actionButton} ${styles.templatesButton}`}
              onClick={() => { /* Toggle */ }}
            >
              <FaBorderAll />
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
            <span className={styles.iconLabel}>Сохр.</span>
          </button>
        </div>

      </div>

      {/* PROPERTIES PANEL (Popover on Mobile) */}
      <div
        className={`${styles.centerGroup} ${(isPropsPanelOpen || (selectedTool === 'image' && activeObject)) ? styles.visible : ''}`}
        ref={propsPanelRef}
      >
        {/* Mobile Header */}
        <div className={styles.popoverHeader}>
          <button
            className={styles.closeButton}
            onClick={() => onToggleProps?.(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.popoverBody}>
          {selectedTool === 'image' && activeObject ? (
            <div className={styles.imageContextControls}>
              <div className={styles.contextGroup}>
                <button className={styles.toolButton} title="Дублировать изображение" aria-label="Дублировать изображение" onClick={onDuplicateObject}>
                  <FaClone />
                </button>
                <button className={styles.toolButton} title="Удалить изображение" aria-label="Удалить изображение" onClick={onDeleteObject}>
                  <FaTrashAlt />
                </button>
              </div>
              <div className={styles.separator} />
              <div className={styles.contextGroup}>
                <button className={styles.toolButton} title="На передний план" aria-label="На передний план" onClick={() => onLayerOrder('front')}>
                  <FaAngleDoubleUp />
                </button>
                <button className={styles.toolButton} title="На один слой вперед" aria-label="На один слой вперед" onClick={() => onLayerOrder('forward')}>
                  <FaLevelUpAlt />
                </button>
                <button className={styles.toolButton} title="На один слой назад" aria-label="На один слой назад" onClick={() => onLayerOrder('backward')}>
                  <FaLevelDownAlt />
                </button>
                <button className={styles.toolButton} title="На задний план" aria-label="На задний план" onClick={() => onLayerOrder('back')}>
                  <FaAngleDoubleDown />
                </button>
              </div>
              <div className={styles.separator} />
              <div className={styles.contextGroup}>
                <button className={styles.toolButton} title="Вписать в холст" aria-label="Вписать в холст" onClick={() => onApplyHelper('fit')}>
                  <FaCompressArrowsAlt />
                </button>
                <button className={styles.toolButton} title="Заполнить холст" aria-label="Заполнить холст" onClick={() => onApplyHelper('fill')}>
                  <FaExpandArrowsAlt />
                </button>
                <button className={styles.toolButton} title="Сбросить трансформацию" aria-label="Сбросить трансформацию" onClick={() => onApplyHelper('reset')}>
                  <FaSyncAlt />
                </button>
              </div>
              <div className={styles.separator} />
              <div className={styles.contextGroup} style={{ gap: '8px' }}>
                <FaAdjust title="Непрозрачность" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={activeObject.opacity ?? 1}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOpacityInput(Math.round(val * 100).toString());
                    onChangeOpacity(val);
                  }}
                  className={styles.lineWidthSlider}
                  title="Непрозрачность слоя"
                  aria-label="Непрозрачность слоя"
                />
                <div className={styles.opacityInputWrapper}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={opacityInput}
                    onChange={(e) => setOpacityInput(e.target.value)}
                    onBlur={(e) => commitOpacity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitOpacity(e.target.value);
                      if (e.key === 'Escape') {
                        const pct = Math.max(1, Math.min(100, Math.round((activeObject.opacity ?? 1) * 100)));
                        setOpacityInput(pct.toString());
                        e.target.blur();
                      }
                    }}
                    className={styles.opacityInput}
                    aria-label="Прозрачность изображения"
                    title="Прозрачность изображения"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {(showThicknessControls && selectedTool !== 'image') && (
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
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default React.memo(Toolbar);
