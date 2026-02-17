import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import styles from "./CanvasComponent.module.scss";

function hexToRgba(hex) {
  if (!hex) return [0, 0, 0, 0];
  let r = 0,
    g = 0,
    b = 0,
    a = 255;
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
  return [
    isNaN(r) ? 0 : r,
    isNaN(g) ? 0 : g,
    isNaN(b) ? 0 : b,
    isNaN(a) ? 255 : a,
  ];
}

const CanvasComponent = forwardRef(
  ({ selectedColor, lineWidth, selectedTool, canEdit = true, onDirtyChange, onHistoryChange }, ref) => {
    // --- Refs ---
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const historyRef = useRef([]);
    const historyStepRef = useRef(-1);
    const drawingDataRef = useRef(null);
    const shapeStartPosRef = useRef(null);
    const canvasSnapshotRef = useRef(null);
    const objectsRef = useRef([]);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const draggingObjectRef = useRef(null);

    // --- State ---
    const [isDrawing, setIsDrawing] = useState(false);
    const [isManipulatingShape, setIsManipulatingShape] = useState(false);
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
    const [, setObjects] = useState([]); // Force update helper for objects
    const [activeObjectId, setActiveObjectId] = useState(null);

    // --- Constants ---
    const MAX_HISTORY = 20;

    // --- History (Undo/Redo) ---
    // Defined here to avoid TDZ in clearCanvas
    const saveSnapshot = useCallback(() => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;

      let rasterData;
      try {
        rasterData = context.getImageData(0, 0, canvas.width, canvas.height);
      } catch { return; }

      const objectsData = objectsRef.current.map(obj => ({ ...obj }));

      if (historyStepRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
      }

      historyRef.current.push({ raster: rasterData, objects: objectsData });

      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      } else {
        historyStepRef.current++;
      }

      // Notify parent
      onDirtyChange?.(true);
      onHistoryChange?.();
    }, [onDirtyChange, onHistoryChange]);

    const fillCanvasBackground = useCallback((context, canvas, bgColor = null) => {
      if (!canvas || !context) return;
      const dpr = window.devicePixelRatio || 1;
      const color =
        bgColor ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--canvas-background")
          .trim();
      const savedOperation = context.globalCompositeOperation;
      context.globalCompositeOperation = "source-over";
      context.fillStyle = color;
      context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      context.globalCompositeOperation = savedOperation;
    }, []);

    const getCoords = useCallback(
      (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
        } else if (event.clientX !== undefined) {
          clientX = event.clientX;
          clientY = event.clientY;
        } else {
          return lastPosition;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
      },
      [lastPosition]
    );

    const drawRectangle = useCallback((context, startX, startY, endX, endY) => {
      if (!context) return;
      context.strokeRect(startX, startY, endX - startX, endY - startY);
    }, []);

    const drawCircle = useCallback((context, startX, startY, endX, endY) => {
      if (!context) return;
      const radiusX = Math.abs(endX - startX) / 2;
      const radiusY = Math.abs(endY - startY) / 2;
      if (radiusX < 0.5 || radiusY < 0.5) return;
      const centerX = Math.min(startX, endX) + radiusX;
      const centerY = Math.min(startY, endY) + radiusY;
      context.beginPath();
      context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      context.stroke();
    }, []);

    const applyCurrentSettings = useCallback(
      (context) => {
        if (!context) return;
        const isEraser = selectedTool === "eraser";

        if (isEraser) {
          context.globalCompositeOperation = "source-over";
          context.strokeStyle = "#000000";
          context.fillStyle = "#000000";
        } else {
          context.globalCompositeOperation = "source-over";
          context.strokeStyle = selectedColor;
          context.fillStyle = selectedColor;
        }

        context.lineWidth = lineWidth;
        context.lineCap = "round";
        context.lineJoin = "round";
      },
      [selectedColor, lineWidth, selectedTool]
    );

    const drawObjects = useCallback(
      (context) => {
        const dpr = window.devicePixelRatio || 1;
        objectsRef.current.forEach((obj) => {
          if (!obj.image) return;
          context.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
          if (obj.id === activeObjectId) {
            context.save();
            context.strokeStyle = "#7ad7ff";
            context.lineWidth = 1.5 / dpr;
            context.strokeRect(obj.x, obj.y, obj.width, obj.height);
            context.restore();
          }
        });
      },
      [activeObjectId]
    );

    const redrawCanvas = useCallback(
      (initialSetup = false) => {
        // console.log("redrawCanvas called", { initialSetup, hasDrawing: !!drawingDataRef.current });
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;
        fillCanvasBackground(context, canvas);
        if (drawingDataRef.current) {
          try {
            context.putImageData(drawingDataRef.current, 0, 0);
          } catch (e) {
            console.error(e);
          }
          if (initialSetup) {
            try {
              drawingDataRef.current = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
            } catch {
              // ignore
            }
          }
        }
        drawObjects(context);
        applyCurrentSettings(context);
      },
      [applyCurrentSettings, fillCanvasBackground, drawObjects]
    );

    const floodFill = useCallback(
      (startX, startY) => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        startX = Math.floor(startX * dpr);
        startY = Math.floor(startY * dpr);
        if (
          startX < 0 ||
          startX >= canvasWidth ||
          startY < 0 ||
          startY >= canvasHeight
        )
          return;

        let imageData;
        try {
          imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        } catch (e) {
          console.error("Flood fill getImageData error:", e);
          return;
        }
        const data = imageData.data;
        const pixelIndex = (startY * canvasWidth + startX) * 4;
        const targetColor = [
          data[pixelIndex],
          data[pixelIndex + 1],
          data[pixelIndex + 2],
          data[pixelIndex + 3],
        ];
        const fillColorRgba = hexToRgba(selectedColor);
        if (!fillColorRgba) return;
        const fillColor = [
          fillColorRgba[0],
          fillColorRgba[1],
          fillColorRgba[2],
          fillColorRgba[3],
        ];
        if (targetColor.every((val, i) => val === fillColor[i])) return;

        const queue = [[startX, startY]];
        const visited = new Set([`${startX},${startY}`]);
        let iterations = 0;
        const maxIterations = canvasWidth * canvasHeight * 1.5;

        while (queue.length > 0 && iterations < maxIterations) {
          iterations++;
          const [x, y] = queue.shift();
          const currentIndex = (y * canvasWidth + x) * 4;
          data[currentIndex] = fillColor[0];
          data[currentIndex + 1] = fillColor[1];
          data[currentIndex + 2] = fillColor[2];
          data[currentIndex + 3] = fillColor[3];
          [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(
            ([nx, ny]) => {
              if (nx >= 0 && nx < canvasWidth && ny >= 0 && ny < canvasHeight) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                  const neighborIndex = (ny * canvasWidth + nx) * 4;
                  if (
                    data[neighborIndex] === targetColor[0] &&
                    data[neighborIndex + 1] === targetColor[1] &&
                    data[neighborIndex + 2] === targetColor[2] &&
                    data[neighborIndex + 3] === targetColor[3]
                  ) {
                    visited.add(key);
                    queue.push([nx, ny]);
                  }
                }
              }
            }
          );
        }
        if (iterations >= maxIterations)
          console.warn("Flood fill iteration limit reached.");
        context.putImageData(imageData, 0, 0);
        try {
          drawingDataRef.current = context.getImageData(
            0,
            0,
            canvasWidth,
            canvasHeight
          );
        } catch (e) {
          console.error("Error saving drawing data after fill:", e);
          drawingDataRef.current = null;
        }
      },
      [selectedColor]
    );

    const clearCanvas = useCallback(() => {
      const ctx = contextRef.current;
      const cnv = canvasRef.current;
      if (ctx && cnv) {
        // Hard Reset: Clear everything and wipe history
        ctx.clearRect(0, 0, cnv.width, cnv.height);

        drawingDataRef.current = null;
        canvasSnapshotRef.current = null;
        objectsRef.current = [];
        setObjects([]);
        setActiveObjectId(null);

        // Reset History
        historyRef.current = [];
        historyStepRef.current = -1;

        // Initial Snapshot (Empty)
        saveSnapshot();
        onHistoryChange?.();
      }
    }, [saveSnapshot, onHistoryChange]);

    const downloadImage = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      redrawCanvas();
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--canvas-background")
        .trim();
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      try {
        const dataUrl = tempCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "paint-again-drawing.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Could not download image.");
      }
    }, [redrawCanvas]);

    const toBlob = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      redrawCanvas();
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--canvas-background")
        .trim();
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      return new Promise((resolve) =>
        tempCanvas.toBlob((blob) => resolve(blob), "image/png")
      );
    }, [redrawCanvas]);

    const addImageObject = useCallback(
      (image) => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;
        const dpr = window.devicePixelRatio || 1;

        // Calculate centered position
        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;
        const maxWidth = logicalWidth * 0.8; // 80% of canvas
        const maxHeight = logicalHeight * 0.8;
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = image.width * ratio;
        const height = image.height * ratio;
        const x = (logicalWidth - width) / 2;
        const y = (logicalHeight - height) / 2;

        // Rasterize Image immediately (so it can be erased)
        context.save();
        context.globalCompositeOperation = "source-over";
        context.drawImage(image, x, y, width, height);
        context.restore();

        // Update Drawing Data
        try {
          drawingDataRef.current = context.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
          console.error("Error saving rasterized image:", e);
        }

        // Save history
        saveSnapshot();
        // redrawCanvas(); // Ensure state consistency
      },
      [saveSnapshot]
    );

    const loadFromFile = useCallback(
      (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => addImageObject(img);
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      },
      [addImageObject]
    );

    const loadFromUrl = useCallback(
      (url) => {
        if (!url) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => addImageObject(img);
        img.src = url;
      },
      [addImageObject]
    );

    const restoreState = useCallback((stepIndex) => {
      const state = historyRef.current[stepIndex];
      if (!state) return;

      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;

      // Restore Raster
      try {
        context.putImageData(state.raster, 0, 0);
        drawingDataRef.current = state.raster; // Sync drawing ref
      } catch (e) {
        console.error("Failed to restore raster state:", e);
      }

      // Restore Objects
      const restoredObjects = state.objects.map(savedObj => ({ ...savedObj }));
      objectsRef.current = restoredObjects;
      setObjects(restoredObjects);

      // Redraw everything
      redrawCanvas();

      onHistoryChange?.();
    }, [redrawCanvas, onHistoryChange]);

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

    const canUndo = () => historyStepRef.current > 0;
    const canRedo = () => historyStepRef.current < historyRef.current.length - 1;



    useImperativeHandle(
      ref,
      () => ({
        clearCanvas: () => {
          clearCanvas();
          saveSnapshot(); // Save cleared state
        },
        downloadImage,
        toBlob,
        loadFromFile: (file) => {
          loadFromFile(file);
          // We need to wait for image load... loadFromFile is async in effect.
          // For now, we rely on the user adding it, which might not be immediate history.
          // Actually, `addImageObject` calls `redrawCanvas`. We should hook there.
        },
        loadFromUrl,
        addImageObject: (img) => {
          addImageObject(img);
          setTimeout(saveSnapshot, 50); // Snapshot after object add
        },
        undo,
        redo,
        canUndo,
        canRedo
      }),
      [clearCanvas, downloadImage, toBlob, loadFromFile, loadFromUrl, addImageObject, undo, redo, saveSnapshot]
    );

    // --- Drawing handlers with object dragging ---
    const startDrawing = useCallback(
      (event) => {
        // Fix: Remove event.button > 0 check to allow touch/stylus
        if (!contextRef.current) return;
        const coords = getCoords(event);

        if (selectedTool === "image") {
          // Objects are now rasterized, so selection logic removed or modified
          // If you want to keep "Move" for *just added* items, it's complex with rasterization.
          // For now, disabling object selection as images are pixels.
          /* 
          const hit = ... 
          */
          return; // No object manipulation
        }

        if (!canEdit) return;

        const context = contextRef.current;
        applyCurrentSettings(context);
        setIsDrawing(true);
        setLastPosition(coords);

        if (selectedTool === "pen" || selectedTool === "eraser") {
          context.beginPath();
          context.moveTo(coords.x, coords.y);
        } else if (selectedTool === "rectangle" || selectedTool === "circle") {
          setIsManipulatingShape(true);
          shapeStartPosRef.current = coords;
          try {
            canvasSnapshotRef.current = context.getImageData(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          } catch (e) {
            console.error("Snapshot error:", e);
            canvasSnapshotRef.current = null;
            setIsManipulatingShape(false);
          }
        } else if (selectedTool === "bucket") {
          floodFill(coords.x, coords.y);
          setIsDrawing(false);
        }
      },
      [applyCurrentSettings, getCoords, selectedTool, floodFill, canEdit]
    );

    const draw = useCallback(
      (event) => {
        if (selectedTool === "image" && draggingObjectRef.current) {
          const coords = getCoords(event);
          const objId = draggingObjectRef.current;
          objectsRef.current = objectsRef.current.map((obj) =>
            obj.id === objId
              ? {
                ...obj,
                x: coords.x - dragOffsetRef.current.x,
                y: coords.y - dragOffsetRef.current.y,
              }
              : obj
          );
          setObjects(objectsRef.current);
          redrawCanvas();
          return;
        }

        if (!isDrawing || !contextRef.current || !canEdit) return;
        const context = contextRef.current;
        const coords = getCoords(event);

        if (
          (selectedTool === "pen" || selectedTool === "eraser") &&
          !isManipulatingShape
        ) {
          context.lineTo(coords.x, coords.y);
          context.stroke();
          setLastPosition(coords);
        } else if (
          (selectedTool === "rectangle" || selectedTool === "circle") &&
          isManipulatingShape
        ) {
          if (!canvasSnapshotRef.current || !shapeStartPosRef.current) return;
          context.putImageData(canvasSnapshotRef.current, 0, 0);
          applyCurrentSettings(context);
          if (selectedTool === "rectangle") {
            drawRectangle(
              context,
              shapeStartPosRef.current.x,
              shapeStartPosRef.current.y,
              coords.x,
              coords.y
            );
          } else if (selectedTool === "circle") {
            drawCircle(
              context,
              shapeStartPosRef.current.x,
              shapeStartPosRef.current.y,
              coords.x,
              coords.y
            );
          }
          setLastPosition(coords);
        }
      },
      [
        isDrawing,
        selectedTool,
        getCoords,
        canEdit,
        drawRectangle,
        drawCircle,
        isManipulatingShape,
        applyCurrentSettings,
        redrawCanvas
      ]
    );

    const stopDrawing = useCallback(() => {
      if (draggingObjectRef.current) {
        draggingObjectRef.current = null;
        return;
      }

      if (!isDrawing || !contextRef.current || !canEdit) return;
      const context = contextRef.current;

      if (
        isManipulatingShape &&
        (selectedTool === "rectangle" || selectedTool === "circle")
      ) {
        if (canvasSnapshotRef.current && shapeStartPosRef.current) {
          context.putImageData(canvasSnapshotRef.current, 0, 0);
          const endCoords = lastPosition;
          applyCurrentSettings(context);
          if (selectedTool === "rectangle") {
            drawRectangle(
              context,
              shapeStartPosRef.current.x,
              shapeStartPosRef.current.y,
              endCoords.x,
              endCoords.y
            );
          } else if (selectedTool === "circle") {
            drawCircle(
              context,
              shapeStartPosRef.current.x,
              shapeStartPosRef.current.y,
              endCoords.x,
              endCoords.y
            );
          }
        }
      }

      canvasSnapshotRef.current = null;
      shapeStartPosRef.current = null;
      setIsManipulatingShape(false);
      setIsDrawing(false);

      try {
        drawingDataRef.current = context.getImageData(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        // Save history state after drawing
        saveSnapshot();
      } catch (e) {
        console.error("Error saving final drawing data:", e);
        drawingDataRef.current = null;
      }
    }, [
      isDrawing,
      isManipulatingShape,
      selectedTool,
      drawRectangle,
      drawCircle,
      applyCurrentSettings,
      lastPosition,
      canEdit,
      saveSnapshot
    ]);

    // --- Resize/setup effect ---
    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      contextRef.current = context;
      let animationFrameId = null;

      const setCanvasDimensions = (initialSetup = false) => {
        if (!canvas.parentElement) return;
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvas.parentElement.getBoundingClientRect();
        const displayWidth = Math.floor(width);
        const displayHeight = Math.floor(height);
        const backingStoreWidth = Math.floor(width * dpr);
        const backingStoreHeight = Math.floor(height * dpr);

        if (
          !initialSetup &&
          canvas.width === backingStoreWidth &&
          canvas.height === backingStoreHeight
        ) {
          return;
        }

        const savedDrawing = drawingDataRef.current;
        canvas.width = backingStoreWidth;
        canvas.height = backingStoreHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        context.resetTransform();
        context.scale(dpr, dpr);
        fillCanvasBackground(context, canvas);

        if (savedDrawing) {
          try {
            const tempC = document.createElement("canvas");
            tempC.width = savedDrawing.width;
            tempC.height = savedDrawing.height;
            tempC.getContext("2d").putImageData(savedDrawing, 0, 0);
            context.drawImage(tempC, 0, 0, displayWidth, displayHeight);
          } catch (e) {
            console.error("Restore error:", e);
            drawingDataRef.current = null;
          }
        }

        drawObjects(context);
        applyCurrentSettings(context);

        if (initialSetup && historyRef.current.length === 0) {
          saveSnapshot(); // Initial empty state
        }
      };

      setCanvasDimensions(true);

      const parentElement = canvas.parentElement;
      const resizeObserver = new ResizeObserver(() => {
        if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        animationFrameId = window.requestAnimationFrame(() =>
          setCanvasDimensions(false)
        );
      });
      if (parentElement) {
        resizeObserver.observe(parentElement);
      }

      return () => {
        if (parentElement) resizeObserver.unobserve(parentElement);
        if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      };
    }, [applyCurrentSettings, fillCanvasBackground, drawObjects, saveSnapshot]);

    useEffect(() => {
      if (contextRef.current && !isManipulatingShape) {
        applyCurrentSettings(contextRef.current);
      }
    }, [selectedColor, lineWidth, selectedTool, applyCurrentSettings, isManipulatingShape]);

    return (
      <canvas
        ref={canvasRef}
        className={styles.paintCanvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      />
    );
  }
);

export default CanvasComponent;
