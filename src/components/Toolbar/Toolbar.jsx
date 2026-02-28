import React, { useState, useRef, useEffect, useLayoutEffect, memo } from "react";

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
  FaFont,
  FaCompressArrowsAlt,
  FaSyncAlt,
  FaAdjust,
  FaBorderAll,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaCheck
} from "react-icons/fa";
import styles from "./Toolbar.module.scss";
import { GOOGLE_FONTS, loadGoogleFont } from "../../utils/fonts";
import PopoverShell from "../UI/PopoverShell/PopoverShell";

const LazyFontItem = memo(({ font, onSelect }) => {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (font === 'sans-serif' || font === 'system-ui') {
      setLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          loadGoogleFont(font).then(() => setLoaded(true)).catch(() => { });
        }
      },
      { rootMargin: '50px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [font]);

  return (
    <button
      ref={ref}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '6px 8px',
        background: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: '14px',
        display: 'block',
        fontFamily: loaded ? `"${font}", system-ui, -apple-system, sans-serif` : 'system-ui, -apple-system, sans-serif',
        cursor: 'pointer',
        borderRadius: '4px'
      }}
      onClick={() => onSelect(font)}
      onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
      onMouseLeave={(e) => e.target.style.background = 'transparent'}
    >
      {font}
    </button>
  );
});

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

// --- GENERIC POPOVER COMPONENT (inline, no portal) ---
// Rendered inside the trigger's parent so it scrolls with the toolbar naturally
const PopoverPortal = ({ triggerRef, isOpen, children, className = "toolGroupPopover", width = 'auto' }) => {
  const popoverRef = useRef(null);

  // Flip above trigger if popover overflows viewport bottom
  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current || !triggerRef.current) return;

    const el = popoverRef.current;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popH = el.offsetHeight;
    const gap = 8;

    // Default: below trigger. Check if it overflows viewport bottom.
    if (triggerRect.bottom + gap + popH > window.innerHeight) {
      // Place above trigger
      el.style.top = 'auto';
      el.style.bottom = '100%';
      el.style.marginBottom = `${gap}px`;
      el.style.marginTop = '0';
    } else {
      // Place below trigger
      el.style.bottom = 'auto';
      el.style.top = '100%';
      el.style.marginTop = `${gap}px`;
      el.style.marginBottom = '0';
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  return (
    <PopoverShell
      ref={popoverRef}
      className={className}
      style={{
        position: 'absolute',
        zIndex: 10000,
        left: 0,
        top: '100%',
        marginTop: '8px',
        width: width !== 'auto' ? width : undefined,
      }}
    >
      {children}
    </PopoverShell>
  );
};

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
  onSaveAsTemplate,
  savingTemplate,
  isEditMode = false,
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
  // Text Handling
  onUpdateText,
}) {
  const [showShapes, setShowShapes] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSearch, setFontSearch] = useState("");

  const [activePopover, setActivePopover] = useState(null); // 'align', 'layers', or null

  const isDrawingTool = ['pen', 'eraser', 'bucket', 'rectangle', 'circle'].includes(selectedTool);

  // Local state for font size input
  const internalFontSize = activeObject?.fontSize ?? 24;
  const [fontSizeInput, setFontSizeInput] = useState(internalFontSize.toString());

  useEffect(() => {
    if (activeObject && activeObject.type === 'text') {
      setFontSizeInput((activeObject.fontSize ?? 24).toString());
    }
  }, [activeObject]);

  const commitFontSize = (valStr) => {
    let size = parseInt(valStr, 10);
    if (isNaN(size)) size = 24;
    size = Math.max(1, Math.min(500, size)); // safe clamp
    setFontSizeInput(size.toString());
    onUpdateText?.({ fontSize: size });
  };

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

  // ResizeObserver Bento Logic
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const centerRef = useRef(null);
  const rightRef = useRef(null);
  const [isBentoMode, setIsBentoMode] = useState(false);

  // Popover Trigger Refs for Portals
  const layersBtnRef = useRef(null);
  const alignBtnRef = useRef(null);
  const fontBtnRef = useRef(null);
  const opacityBtnRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // We observe the container to know exactly when it shrinks below its optimal flex width
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (!leftRef.current || !centerRef.current || !rightRef.current) return;

        const containerW = entry.contentRect.width;

        // We calculate the 'ideal' un-wrapped width.
        // Since bentoMode stretches and wraps things, their offsetWidth changes.
        // To strictly avoid infinite reflow loops, we base the threshold on the children's 
        // scrollWidth or a robust constant when they are forced to unwrap.
        // Actually, scrollWidth is safer if white-space is nowrap.
        const leftW = leftRef.current.scrollWidth + 12; // Add back padding of .glassPanel
        const centerW = centerRef.current.scrollWidth + 12; // Add back padding of .centerGroup
        const rightW = rightRef.current.scrollWidth; // Measures the full panel

        // Sum the physical widths of the modules, plus 2 * 12px gaps (24px)
        const requiredW = leftW + centerW + rightW + 24 + 20; // 20px buffer

        setIsBentoMode((prevBento) => {
          if (!prevBento && containerW > 0 && containerW < requiredW) {
            return true;
          } else if (prevBento && containerW >= requiredW) {
            return false;
          }
          return prevBento;
        });
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [leftRef, centerRef, rightRef]);

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
        if (event.target.closest(`.${styles.toolButton} `)) return;
        // Check if click was on palette portal
        if (event.target.closest(`.${styles.palettePopover} `)) return;

        onToggleProps?.(false);
      }

      // Click Outside logic for Active Popovers (Align, Layers, Fonts)
      if (activePopover !== null) {
        if (event.target.closest('.toolGroupPopover')) return; // Ignore clicks inside the popover itself

        // Let the button handle toggle if clicked directly
        if (activePopover === 'layers' && layersBtnRef.current?.contains(event.target)) return;
        if (activePopover === 'align' && alignBtnRef.current?.contains(event.target)) return;
        if (activePopover === 'opacity' && opacityBtnRef.current?.contains(event.target)) return;

        setActivePopover(null);
      }

      if (showFontPicker) {
        if (event.target.closest('.fontPickerPopover')) return;
        if (fontBtnRef.current?.contains(event.target)) return;
        setShowFontPicker(false);
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
        if (activePopover) setActivePopover(null);
        if (showFontPicker) setShowFontPicker(false);
        if (isPropsPanelOpen) onToggleProps?.(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showShapes, showPalette, activePopover, showFontPicker, isPropsPanelOpen, onToggleProps]);

  // Global Pointer Down to Close Popovers on Canvas/Outside Click
  useEffect(() => {
    const handlePointerDown = (e) => {
      // If none are open, do nothing
      if (!activePopover && !showFontPicker && !showPalette) return;

      const isInsideToolbar = containerRef.current && containerRef.current.contains(e.target);
      const isInsidePopover = e.target.closest('[class*="toolGroupPopover"], [class*="PopoverShell"]');

      // If clicked outside the toolbar and outside any portal'd popover
      if (!isInsideToolbar && !isInsidePopover) {
        setActivePopover(null);
        setShowFontPicker(false);
        setShowPalette(false);
      }
    };

    // capture: true ensures we intercept before canvas drag logic prevents default
    document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, [activePopover, showFontPicker, showPalette]);

  // Reset Popovers on Tool Change to Avoid Stale Reopens
  useEffect(() => {
    setActivePopover(null);
    setShowFontPicker(false);
    setShowPalette(false);
  }, [selectedTool]);

  // Strict Reset: if the user clicks a different element or unselects the canvas object
  useEffect(() => {
    setActivePopover(null);
    setShowFontPicker(false);
    setShowPalette(false);
  }, [activeObject?.id]);




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
    <div className={`${styles.toolbarContainer} ${isBentoMode ? styles.bentoMode : ''} `} ref={containerRef}>

      {/* TOOLS WRAPPER */}
      <div className={styles.toolsWrapper}>

        {/* LEFT: Tools */}
        <div className={styles.glassPanel}>
          <div className={styles.leftGroup} ref={leftRef}>
            <button
              title="Ручка"
              aria-label="Ручка"
              className={`${styles.toolButton} ${selectedTool === "pen" ? styles.active : ""} `}
              onClick={() => handleToolSelect("pen")}
              style={{ color: selectedTool === "pen" ? selectedColor : undefined }}
            >
              <FaPen />
              <span className={styles.iconLabel}>Ручка</span>
            </button>
            <button
              title="Ластик"
              aria-label="Ластик"
              className={`${styles.toolButton} ${selectedTool === "eraser" ? styles.active : ""} `}
              onClick={() => handleToolSelect("eraser")}
            >
              <FaEraser />
              <span className={styles.iconLabel}>Ластик</span>
            </button>
            <button
              title="Заливка"
              aria-label="Заливка"
              className={`${styles.toolButton} ${selectedTool === "bucket" ? styles.active : ""} `}
              onClick={() => handleToolSelect("bucket")}
              style={{ color: selectedTool === "bucket" ? selectedColor : undefined }}
            >
              <FaFillDrip />
              <span className={styles.iconLabel}>Заливка</span>
            </button>

            <div className={styles.separator} />

            {/* Shapes Dropdown Trigger */}
            <div className={styles.shapesWrapper} ref={shapesRef} style={{ position: 'relative' }}>
              <button
                title="Фигуры"
                aria-label="Фигуры"
                className={`${styles.toolButton} ${isShapeActive ? styles.active : ""} `}
                onClick={() => setShowShapes(!showShapes)}
              >
                <FaShapes />
                <span className={styles.iconLabel}>Фигуры</span>
              </button>

              {/* Shapes Popover (inline) */}
              {showShapes && (
                <div
                  className={styles.shapesPopover}
                  id="shapes-portal-content"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    zIndex: 10001
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
                </div>
              )}
            </div>

            <button
              title="Перемещение"
              aria-label="Перемещение/Выбор"
              className={`${styles.toolButton} ${selectedTool === "image" ? styles.active : ""} `}
              onClick={() => handleToolSelect("image")}
            >
              <FaArrowsAlt />
              <span className={styles.iconLabel}>Двигать</span>
            </button>

            <button
              title="Текст"
              aria-label="Текст"
              className={`${styles.toolButton} ${selectedTool === "text" ? styles.active : ""} `}
              onClick={() => handleToolSelect("text")}
            >
              <FaFont />
              <span className={styles.iconLabel}>Текст</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className={`${styles.glassPanel} ${styles.rightGroup} `} ref={rightRef}>
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
            className={`${styles.toolButton} ${isLayersPanelOpen ? styles.activeTool : ''} `}
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
              className={`${styles.actionButton} ${styles.templatesButton} `}
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

          <div className={styles.saveButtonGroup} style={{ display: 'flex', gap: '8px' }}>
            <button
              aria-label="Сохранить"
              title="Сохранить"
              className={`${styles.actionButton} ${styles.saveButton} `}
              onClick={onSaveTemplate}
              disabled={savingTemplate || isReadOnly}
            >
              <FaSave />
              <span className={styles.iconLabel}>Сохр.</span>
            </button>
            {isEditMode && (
              <button
                aria-label="Сохранить как..."
                title="Сохранить как..."
                className={`${styles.actionButton} ${styles.saveButton} `}
                onClick={onSaveAsTemplate}
                disabled={savingTemplate || isReadOnly}
              >
                <FaClone />
                <span className={styles.iconLabel}>Как...</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* PROPERTIES PANEL (Popover on Mobile) */}
      {(isDrawingTool || (activeObject && (activeObject.type === 'image' || activeObject.type === 'text')) || selectedTool === 'text') && (
        <div
          className={`${styles.centerGroup} ${isPropsPanelOpen ? styles.visible : ''} `}
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

          <div className={styles.popoverBody} ref={centerRef}>
            {(() => {
              if (isDrawingTool) return null;
              if (selectedTool === 'text' && !activeObject) {
                return <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Кликните по холсту, чтобы добавить текст</div>;
              }
              if (!activeObject || (activeObject.type !== 'image' && activeObject.type !== 'text')) return null;

              return (
                <div className={styles.imageContextControls}>
                  {activeObject.type !== 'text' && (
                    <div className={styles.contextGroup}>
                      <button className={styles.toolButton} title="Дублировать" aria-label="Дублировать" onClick={onDuplicateObject}>
                        <FaClone />
                      </button>
                      <button className={styles.toolButton} title="Удалить" aria-label="Удалить" onClick={onDeleteObject}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  )}
                  {activeObject.type !== 'text' && <div className={styles.separator} />}
                  {activeObject.type !== 'text' && (
                    <>
                      <div className={styles.contextGroup}>
                        <div style={{ position: 'relative' }}>
                          <button
                            ref={layersBtnRef}
                            className={`${styles.toolButton} ${activePopover === 'layers' ? styles.active : ''} `}
                            title="Слои"
                            aria-label="Слои"
                            onClick={(e) => { e.stopPropagation(); setActivePopover(activePopover === 'layers' ? null : 'layers'); }}
                          >
                            <FaLayerGroup />
                          </button>
                          <PopoverPortal triggerRef={layersBtnRef} isOpen={activePopover === 'layers'}>
                            <button className={styles.toolButton} onClick={(e) => { e.stopPropagation(); onLayerOrder('front'); setActivePopover(null); }} style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 12px' }}><FaAngleDoubleUp style={{ marginRight: '8px' }} />На передний план</button>
                            <button className={styles.toolButton} onClick={(e) => { e.stopPropagation(); onLayerOrder('forward'); setActivePopover(null); }} style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 12px' }}><FaLevelUpAlt style={{ marginRight: '8px' }} />Вперед</button>
                            <button className={styles.toolButton} onClick={(e) => { e.stopPropagation(); onLayerOrder('backward'); setActivePopover(null); }} style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 12px' }}><FaLevelDownAlt style={{ marginRight: '8px' }} />Назад</button>
                            <button className={styles.toolButton} onClick={(e) => { e.stopPropagation(); onLayerOrder('back'); setActivePopover(null); }} style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 12px' }}><FaAngleDoubleDown style={{ marginRight: '8px' }} />На задний план</button>
                          </PopoverPortal>
                        </div>
                      </div>
                      <div className={styles.separator} />
                    </>
                  )}

                  {activeObject.type === 'image' && (
                    <>
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
                    </>
                  )}

                  {activeObject.type === 'text' && (
                    <>
                      <div className={styles.contextGroup}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                          <button
                            ref={fontBtnRef}
                            className={`${styles.toolButton} ${styles.fontPickerBlock}`}
                            style={{ width: '130px', justifyContent: 'flex-start', padding: '4px 8px', fontFamily: activeObject.fontFamily || 'Inter' }}
                            onClick={(e) => { e.stopPropagation(); setShowFontPicker(!showFontPicker); }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeObject.fontFamily || 'Inter'}</span>
                            <FaChevronDown style={{ marginLeft: 'auto', fontSize: '10px' }} />
                          </button>

                          <PopoverPortal triggerRef={fontBtnRef} isOpen={showFontPicker} className="fontPickerPopover" width="180px">
                            <div style={{ padding: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <input
                                autoFocus
                                type="text"
                                placeholder="Поиск шрифта..."
                                value={fontSearch}
                                onChange={(e) => setFontSearch(e.target.value)}
                                className={styles.opacityInput}
                                style={{ width: '100%', padding: '4px 8px' }}
                              />
                            </div>
                            <div style={{ overflowY: 'auto', padding: '4px', maxHeight: '200px' }}>
                              {GOOGLE_FONTS.length === 0 ? (
                                <div style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>Шрифты не загружены</div>
                              ) : (
                                <>
                                  {GOOGLE_FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase())).map(font => (
                                    <LazyFontItem
                                      key={font}
                                      font={font}
                                      onSelect={(chosen) => {
                                        onUpdateText?.({ fontFamily: chosen });
                                        setShowFontPicker(false);
                                        setFontSearch("");
                                      }}
                                    />
                                  ))}
                                  {GOOGLE_FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase())).length === 0 && (
                                    <div style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>Нет результатов</div>
                                  )}
                                </>
                              )}
                            </div>
                          </PopoverPortal>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Размер:</span>
                          <input
                            type="number"
                            min="1" max="500"
                            value={fontSizeInput}
                            onChange={(e) => setFontSizeInput(e.target.value)}
                            onBlur={(e) => commitFontSize(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitFontSize(e.target.value);
                              if (e.key === 'Escape') {
                                setFontSizeInput((activeObject.fontSize ?? 24).toString());
                                e.target.blur();
                              }
                            }}
                            className={styles.opacityInput}
                            style={{ width: '48px' }}
                          />
                        </div>
                      </div>

                      <div className={styles.contextGroup}>
                        <div style={{ position: 'relative' }}>
                          <button
                            ref={alignBtnRef}
                            className={`${styles.toolButton} ${activePopover === 'align' ? styles.active : ''} `}
                            title="Выравнивание"
                            aria-label="Выравнивание"
                            onClick={(e) => { e.stopPropagation(); setActivePopover(activePopover === 'align' ? null : 'align'); }}
                          >
                            {activeObject.alignH === 'center' ? <FaAlignCenter /> : activeObject.alignH === 'right' ? <FaAlignRight /> : <FaAlignLeft />}
                          </button>
                          <PopoverPortal triggerRef={alignBtnRef} isOpen={activePopover === 'align'}>
                            <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
                              <button className={`${styles.toolButton} ${activeObject.alignH === 'left' ? styles.active : ''} `} onClick={(e) => { e.stopPropagation(); onUpdateText?.({ alignH: 'left' }); setActivePopover(null); }}><FaAlignLeft /></button>
                              <button className={`${styles.toolButton} ${activeObject.alignH === 'center' ? styles.active : ''} `} onClick={(e) => { e.stopPropagation(); onUpdateText?.({ alignH: 'center' }); setActivePopover(null); }}><FaAlignCenter /></button>
                              <button className={`${styles.toolButton} ${activeObject.alignH === 'right' ? styles.active : ''} `} onClick={(e) => { e.stopPropagation(); onUpdateText?.({ alignH: 'right' }); setActivePopover(null); }}><FaAlignRight /></button>
                            </div>
                          </PopoverPortal>
                        </div>
                      </div>

                      <div className={styles.separator} />

                      <div className={styles.contextGroup}>
                        <label style={{ backgroundColor: activeObject.color ?? '#000000', width: '28px', height: '28px', borderRadius: 'var(--radius-round)', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
                          <input type="color" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }} value={activeObject.color ?? '#000000'} onChange={(e) => onUpdateText?.({ color: e.target.value })} />
                        </label>
                      </div>

                      <div className={styles.separator} />
                    </>
                  )}

                  <div className={styles.contextGroup}>
                    <div style={{ position: 'relative' }}>
                      <button
                        ref={opacityBtnRef}
                        className={`${styles.toolButton} ${activePopover === 'opacity' ? styles.active : ''}`}
                        title="Непрозрачность слоя"
                        aria-label="Непрозрачность слоя"
                        onClick={(e) => { e.stopPropagation(); setActivePopover(activePopover === 'opacity' ? null : 'opacity'); }}
                      >
                        <FaAdjust />
                      </button>
                      <PopoverPortal triggerRef={opacityBtnRef} isOpen={activePopover === 'opacity'} width="200px">
                        <div style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            style={{ flex: 1 }}
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
                            />
                            <span>%</span>
                          </div>
                        </div>
                      </PopoverPortal>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Drawing Tools (if not in context panels) */}
            {(isDrawingTool || (!activeObject && selectedTool !== 'text' && selectedTool !== 'image')) && (
              <>
                {(showThicknessControls && selectedTool !== 'image') && (
                  <div className={styles.brushControls}>
                    <input
                      type="range"
                      title={`Толщина: ${lineWidth} px`}
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
                            className={`${styles.colorSwatch} ${selectedColor.toUpperCase() === color.toUpperCase() ? styles.active : ""} `}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                            aria-label={color}
                          />
                        ))}
                      </div>

                      {/* Palette Portal (Full Spectrum) */}
                      {showPalette && (
                        <PopoverShell
                          className={styles.palettePopover}
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            marginBottom: '8px',
                            zIndex: 10002
                          }}
                        >
                          <div className={styles.colorPalette}>
                            {colors.map((color) => (
                              <button
                                key={color}
                                className={`${styles.colorSwatch} ${selectedColor.toUpperCase() === color.toUpperCase() ? styles.active : ""} `}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  setSelectedColor(color);
                                  setShowPalette(false);
                                }}
                                aria-label={color}
                              />
                            ))}
                          </div>
                        </PopoverShell>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default React.memo(Toolbar);
