import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import styles from "./CanvasComponent.module.scss";
import { getSession } from "../../utils/session";
import { loadGoogleFont } from "../../utils/fonts";

function hexToRgba(hex) {
  if (!hex) return [0, 0, 0, 0];
  let r = 0, g = 0, b = 0, a = 255;
  hex = hex.trim();
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  } else if (hex.length === 9) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
    a = parseInt(hex[7] + hex[8], 16);
  } else {
    return [0, 0, 0, 0];
  }
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b, isNaN(a) ? 255 : a];
}

// Generate unique ID
const uid = () => Math.random().toString(36).substr(2, 9);

const getWrappedLines = (ctx, text, maxWidth) => {
  const paragraphs = (text || "").split('\n');
  const lines = [];
  paragraphs.forEach(p => {
    const words = p.split(' ');
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width <= maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  });
  return lines;
};

const CanvasComponent = forwardRef(
  (
    {
      selectedColor,
      lineWidth,
      selectedTool,
      canEdit = true,
      onDirtyChange,
      onHistoryChange,
      onActiveObjectChange, // New callback
      onToolChange, // New callback for text tool
    },
    ref
  ) => {
    // --- DOM Refs ---
    const containerRef = useRef(null);
    const mainCanvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);

    // --- Context Refs ---
    const mainCtxRef = useRef(null);
    const overlayCtxRef = useRef(null);
    const paintCanvasRef = useRef(null); // Points to ACTIVE paint layer canvas
    const paintCtxRef = useRef(null);    // Points to ACTIVE paint layer ctx

    // --- State Refs (Avoid stale closures) ---
    const layersRef = useRef([]); // Single source of truth for z-order
    const historyRef = useRef([]);
    const historyStepRef = useRef(-1);
    const activePaintLayerIdRef = useRef(null); // Which paint layer receives drawing

    // --- Multi-layer helpers (plain functions, not hooks) ---
    const createPaintCanvas = (width, height) => {
      const c = document.createElement('canvas');
      c.width = width || 1;
      c.height = height || 1;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      return { canvas: c, ctx };
    };

    const syncActivePaintRefs = () => {
      const activeId = activePaintLayerIdRef.current;
      const paintLayer = layersRef.current.find(l => l.type === 'paint' && l.id === activeId)
        || layersRef.current.find(l => l.type === 'paint');
      if (paintLayer) {
        paintCanvasRef.current = paintLayer.canvas;
        paintCtxRef.current = paintLayer.ctx;
        activePaintLayerIdRef.current = paintLayer.id;
      }
    };

    // Drawing state
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const shapeStartPosRef = useRef(null);
    const shapeSnapshotRef = useRef(null); // ImageData for temp shape drawing in paint layer

    // Object Editing State
    const activeLayerIdRef = useRef(null);
    const transformActionRef = useRef(null); // 'move', 'resize-nw', 'rotate', etc.
    const transformStartRef = useRef(null); // { x, y, layerSnapshot }
    const pointersRef = useRef(new Map()); // For multi-touch

    // --- React State (Triggers re-renders for UI updates if needed) ---
    const [, forceUpdate] = useState({});
    const triggerUpdate = useCallback(() => forceUpdate({}), []);
    const [editingTextId, setEditingTextId] = useState(null);
    const editingTextIdRef = useRef(null);
    const textAreaRef = useRef(null);
    const redrawFrameRef = useRef(null);


    // Let parent know when active layer changes
    const setActiveLayerId = useCallback((id) => {
      activeLayerIdRef.current = id;
      const layer = id ? layersRef.current.find(l => l.id === id) : null;
      // If selecting a paint layer, also make it the active draw target
      if (layer?.type === 'paint') {
        activePaintLayerIdRef.current = id;
        syncActivePaintRefs();
      }
      onActiveObjectChange?.(layer || null);
      renderOverlay();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onActiveObjectChange]);

    // --- Settings helpers ---
    const applyDrawSettings = useCallback((ctx) => {
      if (!ctx) return;
      const isEraser = selectedTool === "eraser";

      ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
      ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : selectedColor;
      ctx.fillStyle = isEraser ? "rgba(0,0,0,1)" : selectedColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, [selectedColor, lineWidth, selectedTool]);

    // --- Rendering Pipeline ---
    const fillCanvasBackground = useCallback((ctx, width, height, bgColor = null) => {
      const color = bgColor || getComputedStyle(document.documentElement).getPropertyValue("--canvas-background").trim() || "#2a2a2e";
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }, []);

    const renderScene = useCallback((ctxToRenderTo = mainCtxRef.current, skipBackground = false) => {
      const canvas = mainCanvasRef.current;
      if (!canvas || !ctxToRenderTo) return;

      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;

      ctxToRenderTo.save();
      ctxToRenderTo.clearRect(0, 0, logicalWidth, logicalHeight);

      if (!skipBackground) {
        fillCanvasBackground(ctxToRenderTo, logicalWidth, logicalHeight);
      }

      // Draw layers bottom to top
      layersRef.current.forEach((layer) => {
        if (!layer.visible) return;

        if (layer.type === "paint") {
          if (layer.canvas) {
            ctxToRenderTo.drawImage(layer.canvas, 0, 0, logicalWidth, logicalHeight);
          }
        } else if (layer.type === "image" || layer.type === "text") {
          ctxToRenderTo.save();
          // Translate to center of layer, rotate, draw, restore
          ctxToRenderTo.translate(layer.x + layer.w / 2, layer.y + layer.h / 2);
          ctxToRenderTo.rotate((layer.rotation || 0) * Math.PI / 180);
          ctxToRenderTo.globalAlpha = layer.opacity ?? 1;

          if (layer.type === "image") {
            if (layer.imgEl) {
              ctxToRenderTo.drawImage(
                layer.imgEl,
                -layer.w / 2,
                -layer.h / 2,
                layer.w,
                layer.h
              );
            } else if (layer.loadError) {
              // Draw placeholder
              ctxToRenderTo.fillStyle = "rgba(255, 0, 0, 0.1)";
              ctxToRenderTo.fillRect(-layer.w / 2, -layer.h / 2, layer.w, layer.h);
              ctxToRenderTo.strokeStyle = "red";
              ctxToRenderTo.lineWidth = 2;
              ctxToRenderTo.setLineDash([5, 5]);
              ctxToRenderTo.strokeRect(-layer.w / 2, -layer.h / 2, layer.w, layer.h);
              ctxToRenderTo.setLineDash([]);

              ctxToRenderTo.fillStyle = "red";
              ctxToRenderTo.font = "14px sans-serif";
              ctxToRenderTo.textAlign = "center";
              ctxToRenderTo.textBaseline = "middle";
              ctxToRenderTo.fillText("⚠ Ошибка", 0, 0);
            }
          } else if (layer.type === "text") {
            // Render text layer
            // Prevent duplicate glyphs if the user is typing via an overlay
            if (layer.id !== editingTextIdRef.current) {
              const lh = layer.lineHeight || 1.2;
              const size = layer.fontSize || 24;
              ctxToRenderTo.font = `${layer.fontStyle || 'normal'} ${layer.fontWeight || 400} ${size}px "${layer.fontFamily || 'system-ui'}", system-ui, -apple-system, sans-serif`;
              ctxToRenderTo.fillStyle = layer.color || "#000000";
              ctxToRenderTo.textAlign = layer.alignH || "left";
              ctxToRenderTo.textBaseline = "top";

              let lines = [];
              if (layer.userResizedWidth) {
                // Manually wrap
                lines = getWrappedLines(ctxToRenderTo, layer.text, layer.w);
              } else {
                lines = (layer.text || "").split('\n');
              }

              const totalHeight = lines.length * size * lh;
              let startY = -layer.h / 2;
              if (layer.alignV === 'middle') startY = -totalHeight / 2;
              else if (layer.alignV === 'bottom') startY = layer.h / 2 - totalHeight;

              let startX = -layer.w / 2;
              if (layer.alignH === 'center') startX = 0;
              else if (layer.alignH === 'right') startX = layer.w / 2;

              lines.forEach((line, i) => {
                ctxToRenderTo.fillText(line, startX, startY + i * size * lh);
              });
            }
          }

          ctxToRenderTo.restore();
        }
      });

      ctxToRenderTo.restore();
    }, [fillCanvasBackground]);



    // Transform Helpers for math
    const rotatePoint = (px, py, cx, cy, angleDeg) => {
      const rad = angleDeg * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const nx = cos * (px - cx) - sin * (py - cy) + cx;
      const ny = sin * (px - cx) + cos * (py - cy) + cy;
      return { x: nx, y: ny };
    };

    const recomputeTextMetrics = useCallback((layer) => {
      if (!layer || layer.type !== "text") return;
      // We can use any context to measure text. mainCtxRef is already set up.
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;

      const size = layer.fontSize || 24;
      const lh = layer.lineHeight || 1.2;
      ctx.font = `${layer.fontStyle || 'normal'} ${layer.fontWeight || 400} ${size}px "${layer.fontFamily || 'system-ui'}", system-ui, -apple-system, sans-serif`;

      if (!layer.userResizedWidth) {
        // Auto width
        const parts = (layer.text || "").split('\n');
        let maxW = 10;
        parts.forEach(line => {
          const met = ctx.measureText(line);
          if (met.width > maxW) maxW = met.width;
        });

        // Capped width check against canvas bounds
        const padding = 40;
        const logicalWidth = mainCanvasRef.current ? mainCanvasRef.current.width / (window.devicePixelRatio || 1) : 400;
        const maxAllowed = logicalWidth - padding;

        if (maxW > maxAllowed) {
          layer.userResizedWidth = true;
          layer.w = maxAllowed;
          const lines = getWrappedLines(ctx, layer.text, layer.w);
          layer.h = Math.max(size * lh, lines.length * size * lh);
        } else {
          // Provide slight padding so cursor stays visible in textarea
          layer.w = maxW + 4;
          layer.h = Math.max(size * lh, parts.length * size * lh);
        }
      } else {
        // Enforce word wrap to layer.w
        const MathW = Math.max(24, layer.w);
        const lines = getWrappedLines(ctx, layer.text, MathW);
        layer.h = Math.max(size * lh, lines.length * size * lh);
        layer.w = MathW;
      }
    }, []);

    // Render Overlay (Handles, bounding box, cursors)
    const renderOverlay = useCallback(() => {
      const canvas = overlayCanvasRef.current;
      const ctx = overlayCtxRef.current;
      const baseCanvas = mainCanvasRef.current;
      const wrapperEl = containerRef.current;
      if (!canvas || !ctx || !baseCanvas || !wrapperEl) return;

      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      // Determine precise size for the cursor based on the CSS coordinate ratio
      const rect = wrapperEl.getBoundingClientRect();
      const scaleX = rect.width > 0 ? baseCanvas.width / rect.width : dpr;
      // The drawn line diameter on backing store is lineWidth. 
      // To see the EXACT same diameter on screen in CSS pixels, divide by scaleX.
      const cssRadius = (lineWidth / scaleX) / 2;

      // 1. Draw Brush Preview
      if ((selectedTool === "pen" || selectedTool === "eraser") && lastPosRef.current) {
        ctx.beginPath();
        ctx.arc(lastPosRef.current.cssX, lastPosRef.current.cssY, Math.max(0.1, cssRadius), 0, Math.PI * 2);
        ctx.strokeStyle = selectedTool === "eraser" ? "rgba(255,255,255,0.8)" : selectedColor;
        ctx.lineWidth = 1 / dpr;
        ctx.stroke();

        if (selectedTool === "eraser") {
          ctx.beginPath();
          // Inner circle for eraser, ensure it doesn't have a negative radius
          ctx.arc(lastPosRef.current.cssX, lastPosRef.current.cssY, Math.max(0.1, cssRadius - 1), 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0,0,0,0.8)";
          ctx.stroke();
        }
      }

      // 2. Draw Selection Box & Handles
      if ((selectedTool === "image" || selectedTool === "text") && activeLayerIdRef.current) {
        const layer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
        if (layer && (layer.type === "image" || layer.type === "text")) {
          ctx.save();
          // Transform to image local space for easy drawing
          ctx.translate(layer.x + layer.w / 2, layer.y + layer.h / 2);
          ctx.rotate((layer.rotation || 0) * Math.PI / 180);

          // Bounding Box
          ctx.strokeStyle = "#5fd6ff";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-layer.w / 2, -layer.h / 2, layer.w, layer.h);

          // Handle size
          const hs = 8;
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#5fd6ff";
          ctx.lineWidth = 1.5;

          const drawHandle = (hx, hy) => {
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
            ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
          };

          // 8 Corner/Edge Handles
          const hw = layer.w / 2;
          const hh = layer.h / 2;

          if (layer.type === "text") {
            // Text only gets E/W handles for width wrapping
            drawHandle(hw, 0);    // E
            drawHandle(-hw, 0);   // W
          } else {
            drawHandle(-hw, -hh); // NW
            drawHandle(0, -hh);   // N
            drawHandle(hw, -hh);  // NE
            drawHandle(hw, 0);    // E
            drawHandle(hw, hh);   // SE
            drawHandle(0, hh);    // S
            drawHandle(-hw, hh);  // SW
            drawHandle(-hw, 0);   // W
          }

          // Rotation Handle
          ctx.beginPath();
          ctx.moveTo(0, -hh);
          ctx.lineTo(0, -hh - 25);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -hh - 25, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Live Size Text (Only while scaling/rotating)
          if (transformActionRef.current && transformActionRef.current.startsWith('resize')) {
            ctx.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))';
            ctx.fillStyle = "white";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${Math.round(layer.w)} × ${Math.round(layer.h)}`, 0, hh + 20);
          } else if (transformActionRef.current === 'rotate') {
            ctx.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))';
            ctx.fillStyle = "white";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            let displayRot = Math.round((layer.rotation || 0) % 360);
            if (displayRot < 0) displayRot += 360;
            ctx.fillText(`${displayRot}°`, 20, -hh - 25);
          }

          ctx.restore();

          // Draw dimension tooltip if actively resizing
          if (transformActionRef.current && transformActionRef.current.startsWith('resize')) {
            ctx.save();
            ctx.font = "12px sans-serif";
            const text = `${Math.round(layer.w)} × ${Math.round(layer.h)}`;
            const textMetrics = ctx.measureText(text);
            const tw = textMetrics.width;
            const th = 12;

            // Project top center offset into global rotated space
            const pt = rotatePoint(
              layer.x + layer.w / 2, layer.y - 20,
              layer.x + layer.w / 2, layer.y + layer.h / 2,
              (layer.rotation || 0)
            );

            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.beginPath();
            ctx.roundRect(pt.x - tw / 2 - 8, pt.y - th / 2 - 6, tw + 16, th + 12, 4);
            ctx.fill();

            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, pt.x, pt.y);
            ctx.restore();
          }
        }
      }
    }, [selectedTool, selectedColor, lineWidth]);

    // Request Animation Frame Scheduler for standard repaint operations
    const scheduleRedraw = useCallback(() => {
      if (redrawFrameRef.current) return;
      redrawFrameRef.current = requestAnimationFrame(() => {
        redrawFrameRef.current = null;
        renderScene();
        renderOverlay();
      });
    }, [renderScene, renderOverlay]);

    useEffect(() => {
      editingTextIdRef.current = editingTextId;
      if (editingTextId) {
        setTimeout(() => {
          if (textAreaRef.current) {
            textAreaRef.current.focus();
            const len = textAreaRef.current.value.length;
            textAreaRef.current.setSelectionRange(len, len); // Move cursor to end
          }
        }, 10);
      }
      scheduleRedraw(); // Sync both canvas and overlay right after state update
    }, [editingTextId, scheduleRedraw]);

    // Use hit-testing to update cursor based on mouse position
    const updateCursor = useCallback((pos) => {
      if (!overlayCanvasRef.current) return;

      const setCursor = (cur) => {
        if (overlayCanvasRef.current.style.cursor !== cur) {
          overlayCanvasRef.current.style.cursor = cur;
        }
      };

      if (!canEdit) {
        setCursor("default");
        return;
      }

      if (selectedTool === "pen" || selectedTool === "eraser") {
        setCursor("none"); // Hide default cursor, we draw the preview
        return;
      }

      if (selectedTool === "bucket") {
        // Using a paint bucket icon or crosshair
        setCursor("crosshair");
        return;
      }

      if (selectedTool === "rectangle" || selectedTool === "circle") {
        setCursor("crosshair");
        return;
      }

      if (selectedTool === "image" || selectedTool === "text") {
        if (!activeLayerIdRef.current || transformActionRef.current) {
          if (!transformActionRef.current) setCursor("default");
          return;
        }

        const layer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
        if (!layer || (layer.type !== "image" && layer.type !== "text")) {
          setCursor("default");
          return;
        }

        // Hit testing Handles
        const action = getTransformAction(pos, layer);
        if (action === "rotate") setCursor("grab");
        else if (action === "resize-nw" || action === "resize-se") setCursor("nwse-resize");
        else if (action === "resize-ne" || action === "resize-sw") setCursor("nesw-resize");
        else if (action === "resize-n" || action === "resize-s") setCursor("ns-resize");
        else if (action === "resize-e" || action === "resize-w") setCursor("ew-resize");
        else if (action === "move") setCursor("move");
        else setCursor("default");
      }
    }, [selectedTool, canEdit]);

    // --- Core History ---
    const saveSnapshot = useCallback(() => {
      // Gather paint data from all paint layers
      const paintDataMap = {};
      for (const layer of layersRef.current) {
        if (layer.type === 'paint' && layer.canvas && layer.ctx) {
          try {
            paintDataMap[layer.id] = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
          } catch { /* ignore */ }
        }
      }

      // Clone layers without canvas/ctx refs
      const clonedLayers = layersRef.current.map(l => {
        const clone = { ...l };
        delete clone.canvas;
        delete clone.ctx;
        return clone;
      });

      if (historyStepRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
      }

      historyRef.current.push({
        paintDataMap,
        layers: clonedLayers,
        activePaintLayerId: activePaintLayerIdRef.current
      });

      const MAX_HISTORY = 20;
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      } else {
        historyStepRef.current++;
      }

      onDirtyChange?.(true);
      onHistoryChange?.();
    }, [onDirtyChange, onHistoryChange]);

    const restoreState = useCallback((stepIndex) => {
      const state = historyRef.current[stepIndex];
      if (!state) return;

      const mainCanvas = mainCanvasRef.current;

      // Restore layers (recreate canvas/ctx for paint layers)
      layersRef.current = state.layers.map(l => {
        const restored = { ...l };
        if (l.type === 'paint') {
          const { canvas, ctx } = createPaintCanvas(
            mainCanvas?.width || 1,
            mainCanvas?.height || 1
          );
          restored.canvas = canvas;
          restored.ctx = ctx;
          const pData = state.paintDataMap?.[l.id];
          if (pData) {
            try { ctx.putImageData(pData, 0, 0); } catch { /* ignore */ }
          }
        }
        return restored;
      });

      // Restore active paint layer
      if (state.activePaintLayerId) {
        activePaintLayerIdRef.current = state.activePaintLayerId;
      }
      syncActivePaintRefs();

      // Ensure the active layer still exists, otherwise null it
      if (!layersRef.current.find(l => l.id === activeLayerIdRef.current)) {
        setActiveLayerId(null);
      }

      renderScene();
      renderOverlay();
      triggerUpdate();
      onHistoryChange?.();
    }, [renderScene, renderOverlay, triggerUpdate, setActiveLayerId, onHistoryChange]);

    const undo = useCallback(() => {
      if (historyStepRef.current > 0) {
        historyStepRef.current--;
        restoreState(historyStepRef.current);
      }
    }, [restoreState]);

    const redo = useCallback(() => {
      if (historyStepRef.current < historyRef.current.length - 1) {
        historyStepRef.current++;
        restoreState(historyStepRef.current);
      }
    }, [restoreState]);


    // --- Layer & Object Creation ---
    const initPaintLayer = useCallback(() => {
      if (!layersRef.current.some(l => l.type === 'paint')) {
        const mcvs = mainCanvasRef.current;
        const { canvas, ctx } = createPaintCanvas(mcvs?.width || 1, mcvs?.height || 1);
        const layer = { id: 'paint-layer-0', type: 'paint', name: 'Слой 1', visible: true, canvas, ctx };
        layersRef.current.push(layer);
        activePaintLayerIdRef.current = layer.id;
        syncActivePaintRefs();
      } else {
        syncActivePaintRefs();
      }
    }, []);

    const addImageLayer = useCallback((imgEl) => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const padding = 16;
      const logicalW = canvas.width / dpr;
      const logicalH = canvas.height / dpr;

      const maxW = logicalW - padding * 2;
      const maxH = logicalH - padding * 2;

      // Center and contain without upscaling
      const scale = Math.min(1, maxW / imgEl.naturalWidth, maxH / imgEl.naturalHeight);
      const w = imgEl.naturalWidth * scale;
      const h = imgEl.naturalHeight * scale;
      const x = (logicalW - w) / 2;
      const y = (logicalH - h) / 2;

      const newLayer = {
        id: uid(),
        type: "image",
        src: imgEl.src,
        imgEl: imgEl,
        x, y, w, h,
        rotation: 0,
        opacity: 1,
        naturalW: imgEl.naturalWidth,
        naturalH: imgEl.naturalHeight,
        visible: true
      };

      layersRef.current.push(newLayer);
      setActiveLayerId(newLayer.id);
      renderScene();
      renderOverlay();
      saveSnapshot();
      triggerUpdate();
    }, [renderScene, renderOverlay, saveSnapshot, triggerUpdate, setActiveLayerId]);

    const loadFromFile = useCallback((file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => addImageLayer(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }, [addImageLayer]);

    const loadFromUrl = useCallback(async (url) => {
      if (!url) throw new Error('URL не указан');

      // Try fetch with auth token (handles CORS + protected assets)
      let finalSrc = null;
      let usedBlob = false;
      try {
        const session = getSession();
        const headers = {};
        if (session?.accessToken) {
          headers['Authorization'] = `Bearer ${session.accessToken}`;
        }
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();

        // Convert to dataURL instead of objectURL to preserve persistence
        finalSrc = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        usedBlob = false; // We don't need to revoke a dataURL
      } catch {
        // Fallback: try direct img.src (for external/public URLs)
        finalSrc = url;
        usedBlob = false;
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          addImageLayer(img);
          if (usedBlob) URL.revokeObjectURL(finalSrc);
          resolve();
        };
        img.onerror = () => {
          if (usedBlob) URL.revokeObjectURL(finalSrc);
          reject(new Error('Не удалось загрузить изображение'));
        };
        img.src = finalSrc;
      });
    }, [addImageLayer]);

    // --- Transform Logic helpers ---
    const getHitLayer = (pos) => {
      // Search top to bottom
      for (let i = layersRef.current.length - 1; i >= 0; i--) {
        const l = layersRef.current[i];
        if ((l.type === "image" || l.type === "text") && l.visible) {
          // Local hit test matching standard rotation
          const local = rotatePoint(pos.cssX, pos.cssY, l.x + l.w / 2, l.y + l.h / 2, -(l.rotation || 0));
          if (local.x >= l.x && local.x <= l.x + l.w && local.y >= l.y && local.y <= l.y + l.h) {
            return l;
          }
        }
      }
      return null;
    };

    const getTransformAction = (pos, layer) => {
      const hs = 12; // Handle hit size (slightly larger for touch)
      const local = rotatePoint(pos.cssX, pos.cssY, layer.x + layer.w / 2, layer.y + layer.h / 2, -(layer.rotation || 0));

      // Coordinates in local space relative to center
      const lx = local.x - (layer.x + layer.w / 2);
      const ly = local.y - (layer.y + layer.h / 2);
      const hw = layer.w / 2;
      const hh = layer.h / 2;

      const inBox = (px, py, bx, by) => Math.abs(px - bx) <= hs / 2 && Math.abs(py - by) <= hs / 2;

      if (layer.type === "text") {
        if (inBox(lx, ly, 0, -hh - 25)) return "rotate";
        if (inBox(lx, ly, hw, 0)) return "resize-e";
        if (inBox(lx, ly, -hw, 0)) return "resize-w";
        if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) return "move";
        return null;
      }

      if (inBox(lx, ly, 0, -hh - 25)) return "rotate";
      if (inBox(lx, ly, -hw, -hh)) return "resize-nw";
      if (inBox(lx, ly, hw, -hh)) return "resize-ne";
      if (inBox(lx, ly, hw, hh)) return "resize-se";
      if (inBox(lx, ly, -hw, hh)) return "resize-sw";

      if (inBox(lx, ly, 0, -hh)) return "resize-n";
      if (inBox(lx, ly, 0, hh)) return "resize-s";
      if (inBox(lx, ly, hw, 0)) return "resize-e";
      if (inBox(lx, ly, -hw, 0)) return "resize-w";

      if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) return "move";

      return null;
    };

    // --- Input Handlers ---
    const getCanvasPoint = useCallback((e) => {
      const baseCanvas = mainCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const wrapperEl = containerRef.current;
      if (!baseCanvas || !overlayCanvas || !wrapperEl) return lastPosRef.current || null;

      let clientX = e.clientX;
      let clientY = e.clientY;

      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }

      const rect = wrapperEl.getBoundingClientRect();
      const cssX = clientX - rect.left;
      const cssY = clientY - rect.top;

      let scaleX = 1;
      let scaleY = 1;
      if (rect.width > 0 && rect.height > 0) {
        scaleX = baseCanvas.width / rect.width;
        scaleY = baseCanvas.height / rect.height;
      }

      return {
        x: cssX * scaleX,
        y: cssY * scaleY,
        cssX,
        cssY
      };
    }, [containerRef]);

    const onPointerDown = useCallback((e) => {
      if (!canEdit) return;
      const pos = getCanvasPoint(e);
      if (!pos) return;
      lastPosRef.current = pos;

      // Multitouch gesture logic
      if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
          pointersRef.current.set(e.touches[i].identifier, {
            x: e.touches[i].clientX,
            y: e.touches[i].clientY
          });
        }
      }

      if (selectedTool === "image" || selectedTool === "text") {
        // Check handles of active layer first
        let action = null;
        let hitLayer = null;
        let activeLayer = layersRef.current.find(l => l.id === activeLayerIdRef.current);

        if (activeLayer) {
          action = getTransformAction(pos, activeLayer);
        }

        if (action) {
          transformActionRef.current = action;

          const startW = activeLayer.w;
          const startH = activeLayer.h;
          const startC = { x: activeLayer.x + startW / 2, y: activeLayer.y + startH / 2 };
          const startR = activeLayer.rotation || 0;

          // Anchor point is the OPPOSITE side handle in local space
          let anchorLocal = { x: 0, y: 0 };
          if (action.includes('w')) anchorLocal.x = startW / 2;
          else if (action.includes('e')) anchorLocal.x = -startW / 2;

          if (action.includes('n')) anchorLocal.y = startH / 2;
          else if (action.includes('s')) anchorLocal.y = -startH / 2;

          transformStartRef.current = {
            startX: pos.cssX,
            startY: pos.cssY,
            layerStart: { ...activeLayer },
            startW,
            startH,
            startC,
            startR,
            anchorLocal,
            aspect: startW / Math.max(startH, 1)
          };
        } else {
          // Hit test for selection
          hitLayer = getHitLayer(pos);
          if (hitLayer) {
            setActiveLayerId(hitLayer.id);
            transformActionRef.current = "move";
            transformStartRef.current = {
              startX: pos.cssX,
              startY: pos.cssY,
              layerStart: { ...hitLayer }
            };
          } else {
            setActiveLayerId(null);

            // ONE-SHOT TEXT PLACEMENT:
            if (selectedTool === "text") {
              const textId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
              const newTextLayer = {
                id: textId,
                type: "text",
                name: "Текст",
                x: pos.cssX - 50,
                y: pos.cssY - 15,
                w: 100,
                h: 30,
                rotation: 0,
                opacity: 1,
                visible: true,
                text: "",
                fontSize: 24,
                fontFamily: "Inter",
                fontWeight: 600,
                color: selectedColor || "#000000",
                alignH: "left",
                alignV: "top",
                lineHeight: 1.2,
                userResizedWidth: false
              };
              layersRef.current.push(newTextLayer);
              setActiveLayerId(textId);
              setEditingTextId(textId);
              if (onToolChange) onToolChange("image"); // Switch back to 'select' to disarm placement natively
              renderScene();
            } else {
              // Not armed -> Commit any active edit or just deselect natively.
              if (editingTextId) setEditingTextId(null);
            }
          }
        }
        renderOverlay();
        // Return only if we hit something, or if we are in 'image' mode.
        // If we are in 'text' mode and hit nothing, we should fall through to Phase 2 text placement. 
        if (selectedTool === "image" || hitLayer || action) {
          return;
        }
      }

      // --- Drawing Tools ---
      isDrawingRef.current = true;

      if (selectedTool === "bucket") {
        // Wrap floodFill to show loader immediately if we had one,
        // but since we optimized the queue, synchronous execution is acceptable
        // if we process downscaled or heavily optimized indexing
        floodFill(pos.x, pos.y);
        isDrawingRef.current = false;
      } else if (selectedTool === "pen" || selectedTool === "eraser") {
        const pCtx = paintCtxRef.current;
        applyDrawSettings(pCtx);
        pCtx.beginPath();
        pCtx.moveTo(pos.x, pos.y);
        // Draw a dot on click
        pCtx.lineTo(pos.x, pos.y);
        pCtx.stroke();
        renderScene();
      } else if (selectedTool === "rectangle" || selectedTool === "circle") {
        shapeStartPosRef.current = pos;
        try {
          shapeSnapshotRef.current = paintCtxRef.current.getImageData(
            0, 0, paintCanvasRef.current.width, paintCanvasRef.current.height
          );
        } catch {
          console.error(e);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canEdit, selectedTool, getCanvasPoint, setActiveLayerId, renderOverlay, applyDrawSettings, renderScene]);

    const onPointerMove = useCallback((e) => {
      const pos = getCanvasPoint(e);
      if (!pos) return;
      updateCursor(pos);

      // Multitouch gesture logic
      if (e.touches) {
        for (let i = 0; i < e.touches.length; i++) {
          pointersRef.current.set(e.touches[i].identifier, {
            x: e.touches[i].clientX,
            y: e.touches[i].clientY
          });
        }
      }

      if ((selectedTool === "image" || selectedTool === "text") && activeLayerIdRef.current && transformActionRef.current) {
        e.preventDefault(); // Prevent scrolling while transforming
        const action = transformActionRef.current;
        const start = transformStartRef.current;
        const layerStr = start.layerStart;

        const dx = pos.cssX - start.startX;
        const dy = pos.cssY - start.startY;

        const layer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
        if (!layer) return;

        if (action === "move") {
          layer.x = layerStr.x + dx;
          layer.y = layerStr.y + dy;
        } else if (action === "rotate") {
          const cx = layerStr.x + layerStr.w / 2;
          const cy = layerStr.y + layerStr.h / 2;
          const angleStart = Math.atan2(start.startY - cy, start.startX - cx);
          const angleNow = Math.atan2(pos.cssY - cy, pos.cssX - cx);
          let angleDelta = (angleNow - angleStart) * 180 / Math.PI;

          let newRot = (layerStr.rotation || 0) + angleDelta;
          if (e.shiftKey) { // Snap to 15 degrees
            newRot = Math.round(newRot / 15) * 15;
          }
          layer.rotation = newRot;
        } else if (action.startsWith('resize')) {
          const { startW, startH, startC, startR, anchorLocal: A, aspect } = start;

          // 1. Convert pointer to local space relative to startC
          const pointerRotated = rotatePoint(pos.cssX, pos.cssY, startC.x, startC.y, -startR);
          const P = {
            x: pointerRotated.x - startC.x,
            y: pointerRotated.y - startC.y
          };

          const MIN_SIZE = 24;
          let newW = startW;
          let newH = startH;

          // Unconstrained distances from anchor to pointer
          let ldx = P.x - A.x;
          let ldy = P.y - A.y;

          const isCorner = ['resize-nw', 'resize-ne', 'resize-sw', 'resize-se'].includes(action);

          if (isCorner) {
            let newW_raw = Math.abs(ldx);
            let newH_raw = Math.abs(ldy);

            let preserveAspect = true;
            if (e.shiftKey) preserveAspect = false;

            if (preserveAspect) {
              if (newW_raw / newH_raw > aspect) {
                newW = newW_raw;
                newH = newW_raw / aspect;
              } else {
                newH = newH_raw;
                newW = newH_raw * aspect;
              }
            } else {
              newW = newW_raw;
              newH = newH_raw;
            }

            newW = Math.max(newW, MIN_SIZE);
            newH = Math.max(newH, MIN_SIZE);
          } else {
            // Side handles: one-axis stretch
            if (action === 'resize-w' || action === 'resize-e') {
              let newW_raw = Math.abs(ldx);
              newW = Math.max(newW_raw, MIN_SIZE);
              newH = startH;
            } else if (action === 'resize-n' || action === 'resize-s') {
              let newH_raw = Math.abs(ldy);
              newH = Math.max(newH_raw, MIN_SIZE);
              newW = startW;
            }
          }

          // 2. Compute new center in local space
          let signX = 0;
          if (action.includes('e')) signX = 1;
          if (action.includes('w')) signX = -1;

          let signY = 0;
          if (action.includes('s')) signY = 1;
          if (action.includes('n')) signY = -1;

          const draggedCornerLocal = {
            x: A.x + signX * newW,
            y: A.y + signY * newH
          };

          const centerLocal = {
            x: (A.x + draggedCornerLocal.x) / 2,
            y: (A.y + draggedCornerLocal.y) / 2
          };

          // 3. Convert new center back to canvas space
          const cos_r = Math.cos(startR * Math.PI / 180);
          const sin_r = Math.sin(startR * Math.PI / 180);

          const newCenterCanvas = {
            x: startC.x + centerLocal.x * cos_r - centerLocal.y * sin_r,
            y: startC.y + centerLocal.x * sin_r + centerLocal.y * cos_r
          };

          layer.w = newW;
          layer.h = newH;
          layer.x = newCenterCanvas.x - newW / 2;
          layer.y = newCenterCanvas.y - newH / 2;

          if (layer.type === "text") {
            layer.userResizedWidth = true;
            recomputeTextMetrics(layer);
          }
        }

        scheduleRedraw();
        return;
      }

      if (!isDrawingRef.current || !canEdit) {
        lastPosRef.current = pos;
        if (activeLayerIdRef.current || selectedTool === "pen" || selectedTool === "eraser") {
          renderOverlay(); // Update hover/brush preview
        }
        return;
      }

      const pCtx = paintCtxRef.current;
      if (!pCtx) return;

      if ((selectedTool === "pen" || selectedTool === "eraser") && !shapeSnapshotRef.current) {
        pCtx.lineTo(pos.x, pos.y);
        pCtx.stroke();
        lastPosRef.current = pos;
        renderScene();
        renderOverlay();
      } else if ((selectedTool === "rectangle" || selectedTool === "circle") && shapeSnapshotRef.current) {
        // Restore snapshot
        pCtx.putImageData(shapeSnapshotRef.current, 0, 0);
        applyDrawSettings(pCtx);

        const sPos = shapeStartPosRef.current;
        pCtx.beginPath();
        if (selectedTool === "rectangle") {
          pCtx.rect(sPos.x, sPos.y, pos.x - sPos.x, pos.y - sPos.y);
        } else if (selectedTool === "circle") {
          const rx = Math.abs(pos.x - sPos.x) / 2;
          const ry = Math.abs(pos.y - sPos.y) / 2;
          const cx = Math.min(pos.x, sPos.x) + rx;
          const cy = Math.min(pos.y, sPos.y) + ry;
          pCtx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        }
        pCtx.stroke();
        lastPosRef.current = pos;
        renderScene();
      }
    }, [selectedTool, canEdit, getCanvasPoint, updateCursor, applyDrawSettings, renderScene, renderOverlay]);

    const onPointerUp = useCallback((e) => {
      // Handle pointer release
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          pointersRef.current.delete(e.changedTouches[i].identifier);
        }
      }

      if (transformActionRef.current) {
        transformActionRef.current = null;
        transformStartRef.current = null;
        saveSnapshot();
        renderOverlay();
        triggerUpdate(); // To update toolbar coordinates if needed
        return;
      }

      if (!isDrawingRef.current || !canEdit) return;

      isDrawingRef.current = false;
      shapeStartPosRef.current = null;
      shapeSnapshotRef.current = null;

      saveSnapshot();
      renderOverlay(); // Clear brush preview if mouse left
    }, [canEdit, saveSnapshot, renderOverlay, triggerUpdate]);

    // --- Flood Fill (Composite-Aware) ---
    const floodFill = useCallback((startX, startY) => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      // We operate in backing store pixels explicitly.
      const cWidth = canvas.width;
      const cHeight = canvas.height;

      const sX = Math.floor(startX);
      const sY = Math.floor(startY);
      if (sX < 0 || sX >= cWidth || sY < 0 || sY >= cHeight) return;

      // 1. Render Composite to temp canvas at FULL backing resolution (NO extra scaling)
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = cWidth;
      tempCanvas.height = cHeight;
      const tempCtx = tempCanvas.getContext("2d");

      // We DO NOT scale tempCtx by DPR because renderScene already receives unscaled tempCtx,
      // and we want exact 1:1 pixel mapping with mainCanvas.
      // Call renderScene, but tell it we are overriding the scale (so it paints logical objects scaled to backing store)
      // Since renderScene internally expects to draw to logical dimensions, we apply a safe workaround:
      tempCtx.scale(dpr, dpr);
      renderScene(tempCtx);

      // 2. Get image data from the fully scaled composite
      let compositeData;
      try {
        compositeData = tempCtx.getImageData(0, 0, cWidth, cHeight);
      } catch (e) {
        console.error("Flood fill getImageData error:", e);
        return;
      }

      const data = compositeData.data;
      const pixelIndex = (sY * cWidth + sX) * 4;
      const targetColor = [
        data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2], data[pixelIndex + 3]
      ];

      const fillRgba = hexToRgba(selectedColor);
      if (!fillRgba) return;

      const tolerance = 64; // Slightly higher tolerance for anti-aliasing boundaries
      const colorMatch = (i) => {
        return Math.abs(data[i] - targetColor[0]) <= tolerance &&
          Math.abs(data[i + 1] - targetColor[1]) <= tolerance &&
          Math.abs(data[i + 2] - targetColor[2]) <= tolerance &&
          Math.abs(data[i + 3] - targetColor[3]) <= tolerance;
      };

      if (colorMatch(pixelIndex) &&
        Math.abs(fillRgba[0] - targetColor[0]) <= tolerance &&
        Math.abs(fillRgba[1] - targetColor[1]) <= tolerance &&
        Math.abs(fillRgba[2] - targetColor[2]) <= tolerance) {
        return; // Already same color
      }

      // Optimize queue to prevent O(N^2) shift array locking
      const maxPixels = cWidth * cHeight;
      const queueX = new Uint16Array(maxPixels);
      const queueY = new Uint16Array(maxPixels);
      let head = 0;
      let tail = 0;

      queueX[tail] = sX;
      queueY[tail] = sY;
      tail++;

      const visited = new Uint8Array(maxPixels);
      visited[sY * cWidth + sX] = 1;

      // Create a mask for the paint layer
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = cWidth;
      maskCanvas.height = cHeight;
      const maskCtx = maskCanvas.getContext("2d");
      const maskData = maskCtx.createImageData(cWidth, cHeight);
      const mdata = maskData.data;

      // Directions: right, left, down, up
      const dx = [1, -1, 0, 0];
      const dy = [0, 0, 1, -1];

      while (head < tail) {
        const x = queueX[head];
        const y = queueY[head];
        head++;

        const i = (y * cWidth + x) * 4;
        mdata[i] = fillRgba[0];
        mdata[i + 1] = fillRgba[1];
        mdata[i + 2] = fillRgba[2];
        mdata[i + 3] = fillRgba[3];

        for (let d = 0; d < 4; d++) {
          const nx = x + dx[d];
          const ny = y + dy[d];

          if (nx >= 0 && nx < cWidth && ny >= 0 && ny < cHeight) {
            const idx = ny * cWidth + nx;
            if (visited[idx] === 0) {
              visited[idx] = 1; // Mark immediately to prevent duplicate queueing
              if (colorMatch(idx * 4)) {
                queueX[tail] = nx;
                queueY[tail] = ny;
                tail++;
              }
            }
          }
        }
      }

      // Phase 3: Edge Quality (1px Morphological Feather Expansion)
      // Dilates the fill region over semi-transparent antialiasing halos
      const expandedMaskData = maskCtx.createImageData(cWidth, cHeight);
      const expMdata = expandedMaskData.data;

      for (let y = 1; y < cHeight - 1; y++) {
        for (let x = 1; x < cWidth - 1; x++) {
          const idx = (y * cWidth + x) * 4;

          // If already filled, copy it
          if (mdata[idx + 3] > 0) {
            expMdata[idx] = mdata[idx];
            expMdata[idx + 1] = mdata[idx + 1];
            expMdata[idx + 2] = mdata[idx + 2];
            expMdata[idx + 3] = mdata[idx + 3];
          } else {
            // Check neighbors for dilation
            const nUp = ((y - 1) * cWidth + x) * 4;
            const nDown = ((y + 1) * cWidth + x) * 4;
            const nLeft = (y * cWidth + (x - 1)) * 4;
            const nRight = (y * cWidth + (x + 1)) * 4;

            if (mdata[nUp + 3] > 0 || mdata[nDown + 3] > 0 || mdata[nLeft + 3] > 0 || mdata[nRight + 3] > 0) {
              expMdata[idx] = fillRgba[0];
              expMdata[idx + 1] = fillRgba[1];
              expMdata[idx + 2] = fillRgba[2];
              expMdata[idx + 3] = fillRgba[3]; // Max opacity to clip the halo
            }
          }
        }
      }

      maskCtx.putImageData(expandedMaskData, 0, 0);

      // Phase 4: Apply mask to paint layer specifically
      const pCtx = paintCtxRef.current;
      pCtx.save();
      pCtx.resetTransform(); // clear any CSS scale matrix offsets before writing
      pCtx.globalCompositeOperation = "source-over";
      pCtx.drawImage(maskCanvas, 0, 0);
      pCtx.restore();

      renderScene();
      saveSnapshot();
    }, [selectedColor, renderScene, saveSnapshot]);

    const clearCanvas = useCallback(() => {
      // Clear all paint layer canvases
      layersRef.current.forEach(l => {
        if (l.type === 'paint' && l.ctx && l.canvas) {
          l.ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
        }
      });
      layersRef.current = [];
      initPaintLayer();
      setActiveLayerId(null);
      historyRef.current = [];
      historyStepRef.current = -1;

      renderScene();
      renderOverlay();
      saveSnapshot();
      triggerUpdate();
    }, [initPaintLayer, renderScene, renderOverlay, saveSnapshot, triggerUpdate]);

    const downloadImage = useCallback(() => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      tempCtx.scale(dpr, dpr);

      renderScene(tempCtx, false);

      try {
        const dataUrl = tempCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "paint-again-drawing.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        alert("Could not download");
      }
    }, [renderScene]);

    const toBlob = useCallback(async () => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return null;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      tempCtx.scale(dpr, dpr);

      renderScene(tempCtx, false);

      return new Promise(resolve => tempCanvas.toBlob(blob => resolve(blob), "image/png"));
    }, [renderScene]);

    // --- Object API ---
    const deleteObject = useCallback((id) => {
      const idx = layersRef.current.findIndex(l => l.id === id);
      if (idx > -1) {
        layersRef.current.splice(idx, 1);
        if (activeLayerIdRef.current === id) setActiveLayerId(null);
        renderScene();
        renderOverlay();
        saveSnapshot();
        triggerUpdate();
      }
    }, [renderScene, renderOverlay, saveSnapshot, triggerUpdate]);

    const duplicateObject = useCallback((id) => {
      const layer = layersRef.current.find(l => l.id === id);
      if (layer && layer.type === "image") {
        const idx = layersRef.current.indexOf(layer);
        const newLayer = { ...layer, id: uid(), x: layer.x + 16, y: layer.y + 16 };
        layersRef.current.splice(idx + 1, 0, newLayer);
        setActiveLayerId(newLayer.id);
        renderScene();
        renderOverlay();
        saveSnapshot();
        triggerUpdate();
      }
    }, [renderScene, renderOverlay, saveSnapshot, triggerUpdate]);

    const reorderObject = useCallback((id, dir) => {
      const targetLayer = layersRef.current.find(l => l.id === id);
      if (!targetLayer) return;
      const idx = layersRef.current.indexOf(targetLayer);
      // layers: 0 is paint layer normally. We only reorder above paint layer?
      // Let's just allow reordering anywhere except BEFORE paint layer if we want
      // But the prompt said Images MUST be layers. Paint MUST persist in a paint layer.

      if (dir === 'forward' && idx < layersRef.current.length - 1) {
        layersRef.current.splice(idx, 1);
        layersRef.current.splice(idx + 1, 0, targetLayer);
      } else if (dir === 'backward' && idx > 0) { // Keep index > 0 to not go behind a potential fixed bg, but layers[0] is paint. Can go behind paint.
        layersRef.current.splice(idx, 1);
        layersRef.current.splice(idx - 1, 0, targetLayer);
      } else if (dir === 'front') {
        layersRef.current.splice(idx, 1);
        layersRef.current.push(targetLayer);
      } else if (dir === 'back') {
        layersRef.current.splice(idx, 1);
        layersRef.current.unshift(targetLayer); // Can go behind paint layer!
      } else {
        return;
      }

      renderScene();
      renderOverlay();
      saveSnapshot();
      triggerUpdate();
    }, [renderScene, renderOverlay, saveSnapshot, triggerUpdate]);

    const applyObjectHelper = useCallback((id, mode) => {
      const layer = layersRef.current.find(l => l.id === id);
      if (!layer || layer.type !== "image") return;
      const canvas = mainCanvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const logicalW = canvas.width / dpr;
      const logicalH = canvas.height / dpr;

      if (mode === 'fit' || mode === 'fill') {
        const padding = mode === 'fit' ? 16 : 0;
        const targetW = logicalW - padding * 2;
        const targetH = logicalH - padding * 2;

        let scale;
        if (mode === 'fit') {
          scale = Math.min(targetW / layer.naturalW, targetH / layer.naturalH);
        } else {
          scale = Math.max(targetW / layer.naturalW, targetH / layer.naturalH);
        }

        layer.w = layer.naturalW * scale;
        layer.h = layer.naturalH * scale;
        layer.x = (logicalW - layer.w) / 2;
        layer.y = (logicalH - layer.h) / 2;
        layer.rotation = 0;
      } else if (mode === 'reset') {
        layer.rotation = 0;
        layer.opacity = 1;
        // Natural size or fit if too big
        const scale = Math.min(1, (logicalW - 32) / layer.naturalW, (logicalH - 32) / layer.naturalH);
        layer.w = layer.naturalW * scale;
        layer.h = layer.naturalH * scale;
      }

      renderScene();
      renderOverlay();
      saveSnapshot();
      triggerUpdate();
    }, [renderScene, renderOverlay, saveSnapshot, triggerUpdate]);

    const changeObjectOpacity = useCallback((id, opacity) => {
      const layer = layersRef.current.find(l => l.id === id);
      if (layer) {
        layer.opacity = opacity;
        renderScene();
        // Optional: saveSnapshot here or debounce
        triggerUpdate();
      }
    }, [renderScene, triggerUpdate]);

    const nudgeObject = useCallback((id, dx, dy) => {
      const layer = layersRef.current.find(l => l.id === id);
      if (layer) {
        layer.x += dx;
        layer.y += dy;
        renderScene();
        renderOverlay();
        triggerUpdate();
      }
    }, [renderScene, renderOverlay, triggerUpdate]);

    // --- Setup & Imperative Handle ---
    useEffect(() => {
      mainCtxRef.current = mainCanvasRef.current.getContext("2d", { willReadFrequently: true });
      overlayCtxRef.current = overlayCanvasRef.current.getContext("2d");

      initPaintLayer();

      const setDimensions = () => {
        const mcvs = mainCanvasRef.current;
        const ocvs = overlayCanvasRef.current;
        if (!mcvs || !mcvs.parentElement) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = mcvs.parentElement.getBoundingClientRect();
        const bw = Math.floor(width * dpr);
        const bh = Math.floor(height * dpr);

        if (mcvs.width !== bw || mcvs.height !== bh) {
          // Save all paint layer data
          const paintDataMap = {};
          layersRef.current.forEach(l => {
            if (l.type === 'paint' && l.canvas && l.canvas.width > 0 && l.canvas.height > 0) {
              try { paintDataMap[l.id] = l.ctx.getImageData(0, 0, l.canvas.width, l.canvas.height); } catch { /* ignore */ }
            }
          });

          mcvs.width = bw; mcvs.height = bh;
          ocvs.width = bw; ocvs.height = bh;
          mcvs.style.width = `${width}px`; mcvs.style.height = `${height}px`;
          ocvs.style.width = `${width}px`; ocvs.style.height = `${height}px`;

          mainCtxRef.current.scale(dpr, dpr);
          overlayCtxRef.current.scale(dpr, dpr);

          // Resize all paint layer canvases and restore data
          layersRef.current.forEach(l => {
            if (l.type === 'paint') {
              l.canvas.width = bw;
              l.canvas.height = bh;
              const pData = paintDataMap[l.id];
              if (pData) {
                try { l.ctx.putImageData(pData, 0, 0); } catch { /* ignore */ }
              }
            }
          });
          syncActivePaintRefs();

          if (historyRef.current.length === 0) {
            saveSnapshot();
          }

          renderScene();
          renderOverlay();
        }
      };

      setDimensions();
      const obs = new ResizeObserver(() => setDimensions());
      if (mainCanvasRef.current.parentElement) obs.observe(mainCanvasRef.current.parentElement);

      return () => obs.disconnect();
    }, [initPaintLayer, renderScene, renderOverlay, saveSnapshot]);

    useEffect(() => {
      applyDrawSettings(paintCtxRef.current);
      const pos = lastPosRef.current;
      if (pos) updateCursor(pos);
      if (selectedTool === "pen" || selectedTool === "eraser" || selectedTool === "image") {
        renderOverlay();
      }
    }, [selectedColor, lineWidth, selectedTool, applyDrawSettings, renderOverlay, updateCursor]);

    // --- Layer Management API ---
    const addPaintLayer = useCallback(() => {
      const mcvs = mainCanvasRef.current;
      const { canvas, ctx } = createPaintCanvas(mcvs?.width || 1, mcvs?.height || 1);
      const paintCount = layersRef.current.filter(l => l.type === 'paint').length + 1;
      const layer = {
        id: uid(),
        type: 'paint',
        name: `Слой ${paintCount}`,
        visible: true,
        canvas,
        ctx,
      };
      const activeIdx = layersRef.current.findIndex(l => l.id === activeLayerIdRef.current);
      if (activeIdx >= 0) {
        layersRef.current.splice(activeIdx + 1, 0, layer);
      } else {
        layersRef.current.push(layer);
      }
      activePaintLayerIdRef.current = layer.id;
      syncActivePaintRefs();
      renderScene();
      saveSnapshot();
      triggerUpdate();
    }, [renderScene, saveSnapshot, triggerUpdate]);

    const deleteLayer = useCallback((id) => {
      const idx = layersRef.current.findIndex(l => l.id === id);
      if (idx < 0) return;
      layersRef.current.splice(idx, 1);
      if (!layersRef.current.some(l => l.type === 'paint')) {
        initPaintLayer();
      }
      if (activeLayerIdRef.current === id) {
        setActiveLayerId(null);
      }
      if (activePaintLayerIdRef.current === id) {
        const firstPaint = layersRef.current.find(l => l.type === 'paint');
        if (firstPaint) activePaintLayerIdRef.current = firstPaint.id;
        syncActivePaintRefs();
      }
      renderScene();
      renderOverlay();
      saveSnapshot();
      triggerUpdate();
    }, [initPaintLayer, renderScene, renderOverlay, saveSnapshot, triggerUpdate, setActiveLayerId]);

    const moveLayer = useCallback((id, direction) => {
      const idx = layersRef.current.findIndex(l => l.id === id);
      if (idx < 0) return;
      let newIdx = idx;
      if (direction === 'up' && idx < layersRef.current.length - 1) newIdx = idx + 1;
      if (direction === 'down' && idx > 0) newIdx = idx - 1;
      if (direction === 'front') newIdx = layersRef.current.length - 1;
      if (direction === 'back') newIdx = 0;
      if (newIdx === idx) return;
      const [layer] = layersRef.current.splice(idx, 1);
      layersRef.current.splice(newIdx, 0, layer);
      renderScene();
      renderOverlay();
      saveSnapshot();
      triggerUpdate();
    }, [renderScene, renderOverlay, saveSnapshot, triggerUpdate]);

    const toggleLayerVisibility = useCallback((id) => {
      const layer = layersRef.current.find(l => l.id === id);
      if (layer) {
        layer.visible = !layer.visible;
        renderScene();
        triggerUpdate();
      }
    }, [renderScene, triggerUpdate]);

    // --- Scene Export / Import ---
    const exportScene = useCallback(() => {
      const mcvs = mainCanvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const logicalW = mcvs ? mcvs.width / dpr : 0;
      const logicalH = mcvs ? mcvs.height / dpr : 0;

      const exportedLayers = layersRef.current.map(l => {
        if (l.type === 'paint') {
          // Serialize paint bitmap as PNG dataURL
          let bitmap = null;
          if (l.canvas && l.canvas.width > 0 && l.canvas.height > 0) {
            try { bitmap = l.canvas.toDataURL('image/png'); } catch { /* ignore */ }
          }
          return { type: 'paint', id: l.id, name: l.name, visible: l.visible, bitmap };
        }
        if (l.type === 'text') {
          return {
            type: 'text', id: l.id, name: l.name, visible: l.visible,
            x: l.x, y: l.y, w: l.w, h: l.h, rotation: l.rotation, opacity: l.opacity,
            text: l.text, fontSize: l.fontSize, fontFamily: l.fontFamily,
            fontWeight: l.fontWeight, fontStyle: l.fontStyle, color: l.color,
            alignH: l.alignH, alignV: l.alignV, lineHeight: l.lineHeight, userResizedWidth: l.userResizedWidth
          };
        }
        // Image layer — serialize transforms + original src
        return {
          type: 'image', id: l.id, name: l.name, visible: l.visible,
          src: l.src, x: l.x, y: l.y, w: l.w, h: l.h,
          rotation: l.rotation, opacity: l.opacity,
          naturalW: l.naturalW, naturalH: l.naturalH,
        };
      });

      return {
        version: 1,
        canvas: { w: logicalW, h: logicalH },
        activePaintLayerId: activePaintLayerIdRef.current,
        layers: exportedLayers,
      };
    }, []);

    const importScene = useCallback(async (scene) => {
      if (!scene || scene.version !== 1 || !Array.isArray(scene.layers)) {
        throw new Error('Неверный формат сцены');
      }

      const mcvs = mainCanvasRef.current;
      const bw = mcvs?.width || 1;
      const bh = mcvs?.height || 1;

      // Clear current state
      layersRef.current = [];
      historyRef.current = [];
      historyStepRef.current = -1;

      // Restore layers
      const imageLoadPromises = [];

      for (const ld of scene.layers) {
        if (ld.type === 'paint') {
          const { canvas, ctx } = createPaintCanvas(bw, bh);
          const layer = { id: ld.id, type: 'paint', name: ld.name || 'Слой', visible: ld.visible !== false, canvas, ctx };
          layersRef.current.push(layer);

          // Load bitmap into canvas
          if (ld.bitmap) {
            const p = new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
                resolve();
              };
              img.onerror = () => resolve(); // Skip on error
              img.src = ld.bitmap;
            });
            imageLoadPromises.push(p);
          }
        } else if (ld.type === 'text') {
          const layer = {
            id: ld.id, type: 'text', name: ld.name || 'Текст', visible: ld.visible !== false,
            x: ld.x || 0, y: ld.y || 0, w: ld.w || 100, h: ld.h || 30, rotation: ld.rotation || 0, opacity: ld.opacity ?? 1,
            text: ld.text || "", fontSize: ld.fontSize || 24, fontFamily: ld.fontFamily || "Inter",
            fontWeight: ld.fontWeight || 600, fontStyle: ld.fontStyle || "normal", color: ld.color || "#000000",
            alignH: ld.alignH || "left", alignV: ld.alignV || "top", lineHeight: ld.lineHeight || 1.2, userResizedWidth: !!ld.userResizedWidth
          };
          layersRef.current.push(layer);
        } else if (ld.type === 'image') {
          // Create image layer shell, load image async
          const layer = {
            id: ld.id, type: 'image', name: ld.name || 'Изображение', visible: ld.visible !== false,
            src: ld.src, imgEl: null, loadError: false,
            x: ld.x || 0, y: ld.y || 0, w: ld.w || 100, h: ld.h || 100,
            rotation: ld.rotation || 0, opacity: ld.opacity ?? 1,
            naturalW: ld.naturalW || ld.w || 100, naturalH: ld.naturalH || ld.h || 100,
          };
          layersRef.current.push(layer);

          // Load image element
          if (ld.src) {
            const p = (async () => {
              try {
                // Reuse fetch→blob approach for CORS/auth
                const session = getSession();
                const headers = {};
                if (session?.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
                let objectUrl = ld.src;
                let usedBlob = false;

                if (!ld.src.startsWith('data:')) {
                  try {
                    const res = await fetch(ld.src, { headers });
                    if (res.ok) {
                      const blob = await res.blob();
                      objectUrl = URL.createObjectURL(blob);
                      usedBlob = true;
                    }
                  } catch { /* fallback to direct src */ }
                }

                await new Promise((resolve, reject) => {
                  const img = new Image();
                  img.onload = () => {
                    layer.imgEl = img;
                    layer.naturalW = img.naturalWidth;
                    layer.naturalH = img.naturalHeight;
                    if (usedBlob) URL.revokeObjectURL(objectUrl);
                    resolve();
                  };
                  img.onerror = () => {
                    if (usedBlob) URL.revokeObjectURL(objectUrl);
                    reject();
                  };
                  img.src = objectUrl;
                });
              } catch {
                layer.loadError = true;
                console.warn(`Не удалось загрузить слой-изображение ${layer.id}`);
              }
            })();
            imageLoadPromises.push(p);
          }
        }
      }

      // Wait for all bitmaps/images to load
      await Promise.all(imageLoadPromises);

      const hasErrors = layersRef.current.some(l => l.loadError);
      if (hasErrors) {
        setTimeout(() => alert("Некоторые изображения не удалось восстановить (возможно, они были временными). Слой сохранён в виде заглушки."), 100);
      }

      // Set active paint layer
      if (scene.activePaintLayerId) {
        activePaintLayerIdRef.current = scene.activePaintLayerId;
      }

      // Ensure at least one paint layer
      if (!layersRef.current.some(l => l.type === 'paint')) {
        initPaintLayer();
      }

      layersRef.current.forEach(l => {
        if (l.type === 'text' && l.fontFamily) {
          loadGoogleFont(l.fontFamily).then(() => {
            recomputeTextMetrics(l);
            scheduleRedraw();
          }).catch(() => { });
        }
      });

      syncActivePaintRefs();
      scheduleRedraw();
      saveSnapshot();
      triggerUpdate();
    }, [initPaintLayer, renderScene, renderOverlay, scheduleRedraw, saveSnapshot, triggerUpdate]);

    useImperativeHandle(ref, () => ({
      clearCanvas,
      downloadImage,
      toBlob,
      loadFromFile,
      loadFromUrl,
      addImageObject: (img) => addImageLayer(img),
      undo,
      redo,
      canUndo: () => historyStepRef.current > 0,
      canRedo: () => historyStepRef.current < historyRef.current.length - 1,
      // Image Object API
      deleteObject,
      duplicateObject,
      reorderObject,
      applyObjectHelper,
      changeObjectOpacity,
      nudgeObject,
      // Layer Management API
      addPaintLayer,
      deleteLayer,
      moveLayer,
      toggleLayerVisibility,
      selectLayer: (id) => setActiveLayerId(id),
      getLayers: () => layersRef.current.map(l => {
        const clone = { ...l, name: l.name || (l.type === 'paint' ? 'Слой' : l.type === 'text' ? 'Текст' : 'Изображение') };
        return clone;
      }),
      getActivePaintLayerId: () => activePaintLayerIdRef.current,
      getActiveLayerId: () => activeLayerIdRef.current,
      // Metadata/Property API
      updateLayer: (id, updates) => {
        const layer = layersRef.current.find(l => l.id === id);
        if (layer) {
          Object.assign(layer, updates);

          if (updates.fontFamily) {
            // Immediate sync application before network resolves
            if (layer.type === 'text') recomputeTextMetrics(layer);
            scheduleRedraw();
            triggerUpdate();

            loadGoogleFont(updates.fontFamily).then(() => {
              // Delayed re-application once kerning metrics land
              if (layer.type === 'text') recomputeTextMetrics(layer);
              scheduleRedraw();
              triggerUpdate();
            }).catch(() => { });
          } else {
            if (layer.type === 'text') recomputeTextMetrics(layer);
            scheduleRedraw();
            triggerUpdate();
          }

          saveSnapshot();
        }
      },
      exitTextMode: () => {
        setEditingTextId(null);
        setActiveLayerId(null);
        scheduleRedraw();
      },
      commitTextEdit: () => {
        setEditingTextId(null);
      },
      // Scene persistence
      exportScene,
      importScene,
    }), [
      clearCanvas, downloadImage, toBlob, loadFromFile, loadFromUrl, addImageLayer,
      undo, redo, deleteObject, duplicateObject, reorderObject, applyObjectHelper, changeObjectOpacity, nudgeObject,
      addPaintLayer, deleteLayer, moveLayer, toggleLayerVisibility, setActiveLayerId,
      exportScene, importScene, recomputeTextMetrics, scheduleRedraw, saveSnapshot, triggerUpdate
    ]);

    return (
      <div ref={containerRef} className={styles.canvasWrapper}
        style={{ position: 'relative', width: '100%', height: '100%' }}>

        <canvas
          ref={mainCanvasRef}
          className={styles.paintCanvas}
          style={{ display: 'block' }}
        />

        <canvas
          ref={overlayCanvasRef}
          className={styles.overlayCanvas}
          style={{ position: 'absolute', top: 0, left: 0, touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => {
            if (!canEdit) return;
            const pos = getCanvasPoint(e);
            if (!pos) return;
            const hitLayer = getHitLayer(pos);
            if (hitLayer && hitLayer.type === "text") {
              setActiveLayerId(hitLayer.id);
              setEditingTextId(hitLayer.id);
              if (onToolChange) onToolChange("image");
              renderOverlay();
            }
          }}
          onKeyDown={(e) => {
            if (selectedTool === 'text' && e.key === 'Escape') {
              e.preventDefault();
              if (onToolChange) onToolChange('image');
            }
          }}
          tabIndex={selectedTool === 'text' ? 0 : undefined}
        />

        {editingTextId && (() => {
          const layer = layersRef.current.find(l => l.id === editingTextId);
          if (!layer) return null;

          const left = layer.x;
          const top = layer.y;

          return (
            <textarea
              ref={textAreaRef}
              style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${layer.w}px`,
                height: `${layer.h}px`,
                transform: `rotate(${layer.rotation || 0}deg)`,
                transformOrigin: '50% 50%',
                background: 'transparent',
                border: '1px solid #5fd6ff',
                outline: 'none',
                resize: 'none',
                padding: 0,
                margin: 0,
                overflow: 'hidden',
                fontSize: `${layer.fontSize}px`,
                fontFamily: `"${layer.fontFamily || 'system-ui'}", system-ui, -apple-system, sans-serif`,
                fontWeight: layer.fontWeight,
                fontStyle: layer.fontStyle,
                color: layer.color,
                textAlign: layer.alignH,
                lineHeight: layer.lineHeight,
                opacity: layer.opacity,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                zIndex: 1000
              }}
              value={layer.text || ""}
              onChange={(e) => {
                layer.text = e.target.value;
                recomputeTextMetrics(layer);
                scheduleRedraw();
                triggerUpdate();
              }}
              onBlur={() => {
                if (!layer.text.trim()) {
                  // Delete if empty
                  layersRef.current = layersRef.current.filter(l => l.id !== layer.id);
                  setActiveLayerId(null);
                }
                setEditingTextId(null);
                scheduleRedraw();
                saveSnapshot();
              }}
              onKeyDown={(e) => {
                e.stopPropagation(); // prevent window hotkeys
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.target.blur();
                }
              }}
            />
          );
        })()}
      </div>
    );
  }
);

export default CanvasComponent;
