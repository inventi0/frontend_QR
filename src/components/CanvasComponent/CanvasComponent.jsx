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
  ({ selectedColor, lineWidth, selectedTool, setSelectedTool, theme, canEdit = true }, ref) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isManipulatingShape, setIsManipulatingShape] = useState(false);
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
    const shapeStartPosRef = useRef(null);

    // Offscreen Canvas for "baked" drawing (background + pen strokes)
    const offscreenCanvasRef = useRef(null);

    // objects layer
    const [objects, setObjects] = useState([]);
    const objectsRef = useRef([]);
    const [activeObjectId, setActiveObjectId] = useState(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const draggingObjectRef = useRef(null);
    const resizingHandleRef = useRef(null); // Track which handle is being dragged
    const resizeStartRef = useRef(null); // Initial state for resize

    // Persistence Helpers
    const saveToStorage = useCallback(() => {
        if (!offscreenCanvasRef.current) return;
        const state = {
            objects: objectsRef.current,
            startColor: null, // Could save background color if tracked
            timestamp: Date.now()
        };
        localStorage.setItem('qr_editor_objects', JSON.stringify(state));
        // Save image data
        const dataUrl = offscreenCanvasRef.current.toDataURL();
        localStorage.setItem('qr_editor_image', dataUrl);
    }, []);

    const loadFromStorage = useCallback((context) => {
        try {
            const objsStr = localStorage.getItem('qr_editor_objects');
            const imgStr = localStorage.getItem('qr_editor_image');
            
            if (objsStr) {
                const parsed = JSON.parse(objsStr);
                if (parsed.objects) {
                    // Re-hydrate images from stored src
                    const hydratedObjects = parsed.objects.map(obj => {
                        if (obj.imageSrc) {
                            const img = new Image();
                            img.src = obj.imageSrc;
                            return { ...obj, image: img };
                        }
                        return obj;
                    });
                    objectsRef.current = hydratedObjects;
                    setObjects(hydratedObjects);
                }
            }

            if (imgStr && offscreenCanvasRef.current) {
                const img = new Image();
                img.onload = () => {
                   const offCtx = offscreenCanvasRef.current.getContext('2d');
                   offCtx.clearRect(0,0, offscreenCanvasRef.current.width, offscreenCanvasRef.current.height);
                   offCtx.drawImage(img, 0, 0);
                   redrawCanvas();
                };
                img.src = imgStr;
            }
        } catch (e) {
            console.error("Failed to load state", e);
        }
    }, []);

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
        context.globalCompositeOperation = isEraser
          ? "destination-out"
          : "source-over";
        context.strokeStyle = selectedColor;
        context.fillStyle = selectedColor;
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
          if (obj.type === "text") {
            context.font = `${obj.fontSize}px ${obj.fontFamily}`;
            context.fillStyle = obj.color;
            context.fillText(obj.text, obj.x, obj.y);

            if (obj.id === activeObjectId) {
              const metrics = context.measureText(obj.text);
              const textWidth = metrics.width;
              const textHeight = obj.fontSize; // Approximate height
              context.save();
              context.strokeStyle = "#7ad7ff";
              context.lineWidth = 1.5 / dpr;
              // Draw box around text
              context.strokeRect(
                obj.x - 4,
                obj.y - textHeight,
                textWidth + 8,
                textHeight + 8
              );
              context.restore();
              drawSelectionHandles(context, obj);
            }
          } else if (obj.image) {
            context.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
            if (obj.id === activeObjectId) {
              context.save();
              context.strokeStyle = "#7ad7ff";
              context.lineWidth = 1.5 / dpr;
              context.strokeRect(obj.x, obj.y, obj.width, obj.height);
              context.restore();
              drawSelectionHandles(context, obj);
            }
          }
        });
      },
      [activeObjectId]
    );

    const drawSelectionHandles = useCallback((context, obj) => {
        const dpr = window.devicePixelRatio || 1;
        const size = 8 * dpr; // Handle size
        const half = size / 2;
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#7ad7ff";
        context.lineWidth = 1.5 / dpr;

        let x, y, w, h;
        if (obj.type === 'text') {
            const metrics = context.measureText(obj.text);
            w = metrics.width + 8;
            h = obj.fontSize + 8;
            x = obj.x - 4;
            y = obj.y - obj.fontSize;
        } else {
            x = obj.x;
            y = obj.y;
            w = obj.width;
            h = obj.height;
        }

        const handles = [
            { x: x - half, y: y - half }, // TL
            { x: x + w - half, y: y - half }, // TR
            { x: x - half, y: y + h - half }, // BL
            { x: x + w - half, y: y + h - half }, // BR
        ];

        handles.forEach(h => {
            context.fillRect(h.x, h.y, size, size);
            context.strokeRect(h.x, h.y, size, size);
        });
    }, []);

    const redrawCanvas = useCallback(
      (initialSetup = false) => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        const offscreen = offscreenCanvasRef.current;
        if (!canvas || !context) return;

        // 1. Clear Main Canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Background (from Offscreen)
        if (offscreen) {
            context.drawImage(offscreen, 0, 0);
        } else {
             // Fallback if offscreen not ready (shouldn't happen after init)
             fillCanvasBackground(context, canvas);
        }

        // 3. Draw Objects on top
        drawObjects(context);
        
        // 4. Apply settings for next draw
        applyCurrentSettings(context);
      },
      [applyCurrentSettings, fillCanvasBackground, drawObjects]
    );

    const floodFill = useCallback(
      (startX, startY) => {
        // Perform fill on OFFSCREEN canvas
        const canvas = offscreenCanvasRef.current; 
        if (!canvas) return;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
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
        redrawCanvas(); // Update main canvas
        saveToStorage();
      },
      [selectedColor, redrawCanvas, saveToStorage]
    );

    const clearCanvas = useCallback(() => {
      const ctx = contextRef.current;
      const cnv = canvasRef.current;
      const offCtx = offscreenCanvasRef.current?.getContext('2d');
      if (ctx && cnv) {
        fillCanvasBackground(ctx, cnv);
        if (offscreenCanvasRef.current && offCtx) {
             fillCanvasBackground(offCtx, offscreenCanvasRef.current);
        }
        
        objectsRef.current = [];
        setObjects([]);
        setActiveObjectId(null);
        saveToStorage();
      }
    }, [fillCanvasBackground, saveToStorage]);

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
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;
        // Заполняем весь холст (100%)
        const maxWidth = logicalWidth;
        const maxHeight = logicalHeight;
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = image.width * ratio;
        const height = image.height * ratio;
        const x = (logicalWidth - width) / 2;
        const y = (logicalHeight - height) / 2;
        const newObj = {
          id: Date.now() + Math.random(),
          image,
          imageSrc: image.src, // Store source for persistence
          width,
          height,
          x,
          y,
        };
        objectsRef.current = [...objectsRef.current, newObj];
        setObjects(objectsRef.current);
        redrawCanvas();
        saveToStorage();
      },
      [redrawCanvas, saveToStorage]
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

    useImperativeHandle(
      ref,
      () => ({
        clearCanvas,
        downloadImage,
        toBlob,
        loadFromFile,
        loadFromUrl,
        addImageObject,
      }),
      [clearCanvas, downloadImage, toBlob, loadFromFile, loadFromUrl, addImageObject]
    );

    // --- Drawing handlers with object dragging ---
    const startDrawing = useCallback(
      (event) => {
        if (event.button > 0 || !contextRef.current) return;
        const coords = getCoords(event);

         // 1. SELECT TOOL LOGIC
        if (selectedTool === "select") {
           // A. Check for Handle Hit (Resizing)
           if (activeObjectId) {
               const obj = objectsRef.current.find(o => o.id === activeObjectId);
               if (obj) {
                   // Calculate bounds
                   let x, y, w, h;
                   if (obj.type === 'text') {
                       const context = contextRef.current;
                       context.font = `${obj.fontSize}px ${obj.fontFamily}`;
                       const metrics = context.measureText(obj.text);
                       w = metrics.width + 8;
                       h = obj.fontSize + 8;
                       x = obj.x - 4;
                       y = obj.y - obj.fontSize;
                   } else {
                       x = obj.x; y = obj.y; w = obj.width; h = obj.height;
                   }

                   const dpr = window.devicePixelRatio || 1;
                   const size = 10 * dpr; // slightly larger hit area
                   const half = size / 2;
                   
                   // Check corners: TL, TR, BL, BR
                   const handles = {
                       tl: { x: x, y: y },
                       tr: { x: x + w, y: y },
                       bl: { x: x, y: y + h },
                       br: { x: x + w, y: y + h }
                   };

                   for (const [key, pos] of Object.entries(handles)) {
                       if (
                           coords.x >= pos.x - half && coords.x <= pos.x + half &&
                           coords.y >= pos.y - half && coords.y <= pos.y + half
                       ) {
                           resizingHandleRef.current = key;
                           resizeStartRef.current = { 
                               x: coords.x, 
                               y: coords.y,
                               objX: obj.x,
                               objY: obj.y,
                               objW: w,
                               objH: h,
                               fontSize: obj.fontSize
                            };
                           return; // Start Resizing
                       }
                   }
               }
           }

           // B. Check for Object Hit (Moving)
           const hit = [...objectsRef.current].reverse().find((obj) => {
             if (obj.type === "text") {
                const context = contextRef.current;
                context.font = `${obj.fontSize}px ${obj.fontFamily}`;
                const metrics = context.measureText(obj.text);
                const width = metrics.width;
                const height = obj.fontSize; 
                return (
                 coords.x >= obj.x &&
                 coords.x <= obj.x + width &&
                 coords.y >= obj.y - height &&
                 coords.y <= obj.y
                );
             } else {
               // Image object
               return (
                 coords.x >= obj.x &&
                 coords.x <= obj.x + obj.width &&
                 coords.y >= obj.y &&
                 coords.y <= obj.y + obj.height
               );
             }
           });

           if (hit) {
             draggingObjectRef.current = hit.id;
             dragOffsetRef.current = { x: coords.x - hit.x, y: coords.y - hit.y };
             setActiveObjectId(hit.id);
             redrawCanvas(); // Highlight selected
             return;
           } else {
             // Clicked on empty space -> Deselect
             setActiveObjectId(null);
             redrawCanvas();
           }
        }

        // 2. TEXT TOOL LOGIC (Only Add)
        if (selectedTool === "text") {
             const text = prompt("Введите текст:", "Новый текст");
             if (text) {
                const newObj = {
                  id: Date.now(),
                  type: "text",
                  text,
                  x: coords.x,
                  y: coords.y,
                  color: selectedColor,
                  fontSize: 24,
                  fontFamily: "Arial",
                };
                objectsRef.current = [...objectsRef.current, newObj];
                setObjects(objectsRef.current);
                setActiveObjectId(newObj.id);
                redrawCanvas();
                saveToStorage();
             }
             return;
        }

        if (!canEdit) return;

        // 3. DRAWING TOOLS (Pen, Eraser, Shapes)
        const context = contextRef.current;
        const offCtx = offscreenCanvasRef.current?.getContext('2d');
        
        setIsDrawing(true);
        setLastPosition(coords);

        if (selectedTool === "pen" || selectedTool === "eraser") {
            // Apply settings to BOTH contexts
            applyCurrentSettings(context);
            if (offCtx) applyCurrentSettings(offCtx);

            context.beginPath();
            context.moveTo(coords.x, coords.y);
            if (offCtx) {
                offCtx.beginPath();
                offCtx.moveTo(coords.x, coords.y);
            }

        } else if (selectedTool === "rectangle" || selectedTool === "circle") {
          setIsManipulatingShape(true);
          shapeStartPosRef.current = coords;
          // No offscreen drawing yet, just preview
        } else if (selectedTool === "bucket") {
          floodFill(coords.x, coords.y);
          setIsDrawing(false);
        }
      },
      [applyCurrentSettings, getCoords, selectedTool, floodFill, redrawCanvas, saveToStorage]
    );

      const draw = useCallback(
      (event) => {
        // RESIZING OBJECTS
        if (selectedTool === "select" && resizingHandleRef.current && activeObjectId) {
             const coords = getCoords(event);
             const handle = resizingHandleRef.current;
             const startState = resizeStartRef.current;
             const dx = coords.x - startState.x;
             const dy = coords.y - startState.y;

             objectsRef.current = objectsRef.current.map(obj => {
                 if (obj.id !== activeObjectId) return obj;

                 let newX = obj.x;
                 let newY = obj.y;
                 let newW = obj.width; // For images
                 let newH = obj.height; // For images
                 let newSize = obj.fontSize; // For text

                 // Simple resize logic (Aspect ratio not constrained for simplicity, but could be)
                 // TEXT RESIZING
                 if (obj.type === 'text') {
                     // For text, we change fontSize based on drag distance
                     // Dragging BR/TR increases size, BL/TL decreases (simplified)
                     // A better way is to scale based on vertical delta
                     if (handle.includes('b')) {
                         newSize = Math.max(10, startState.fontSize + dy);
                     } else {
                         newSize = Math.max(10, startState.fontSize - dy);
                     }
                     return { ...obj, fontSize: newSize };
                 } 
                 
                 // IMAGE RESIZING
                 else {
                     if (handle.includes('r')) newW = Math.max(20, startState.objW + dx);
                     if (handle.includes('b')) newH = Math.max(20, startState.objH + dy);
                     if (handle.includes('l')) {
                         newW = Math.max(20, startState.objW - dx);
                         newX = startState.objX + dx;
                     }
                     if (handle.includes('t')) {
                         newH = Math.max(20, startState.objH - dy);
                         newY = startState.objY + dy;
                     }
                     return { ...obj, x: newX, y: newY, width: newW, height: newH };
                 }
             });
             setObjects(objectsRef.current);
             redrawCanvas();
             return;
        }

        // MOVING OBJECTS
        if (selectedTool === "select" && draggingObjectRef.current) {
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
          redrawCanvas(); // Re-render logic handles offscreen + objects
          return;
        }

        if (!isDrawing || !contextRef.current || !canEdit) return;
        const context = contextRef.current;
        const offCtx = offscreenCanvasRef.current?.getContext('2d');
        const coords = getCoords(event);

        if (
          (selectedTool === "pen" || selectedTool === "eraser") &&
          !isManipulatingShape
        ) {
          // Draw on VISUAL canvas
          context.lineTo(coords.x, coords.y);
          context.stroke();
          
          // Draw on OFFSCREEN canvas (data)
          if (offCtx) {
              offCtx.lineTo(coords.x, coords.y);
              offCtx.stroke();
          }

          setLastPosition(coords);
        } else if (
          (selectedTool === "rectangle" || selectedTool === "circle") &&
          isManipulatingShape
        ) {
          // For shapes, we simply redraw everything + the shape preview
          // Since we don't have "undo" for the main canvas, we rely on redrawCanvas clearing it
          if (!shapeStartPosRef.current) return;
          
          redrawCanvas(); // Clears and draws offscreen background + objects
          
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
        isManipulatingShape,
        getCoords,
        selectedTool,
        drawRectangle,
        drawCircle,
        applyCurrentSettings,
        redrawCanvas,
      ]
    );

    const stopDrawing = useCallback(() => {
      // End Object Drag or Resize
      if (selectedTool === "select") {
          if (draggingObjectRef.current || resizingHandleRef.current) {
            draggingObjectRef.current = null;
            resizingHandleRef.current = null;
            resizeStartRef.current = null;
            saveToStorage();
            return;
          }
      }

      if (!isDrawing || !contextRef.current || !canEdit) return;
      const context = contextRef.current;
      const offCtx = offscreenCanvasRef.current?.getContext('2d');

      // Commit Shapes to Offscreen
      if (
        isManipulatingShape &&
        (selectedTool === "rectangle" || selectedTool === "circle")
      ) {
        if (shapeStartPosRef.current && offCtx) {
          const endCoords = lastPosition;
          applyCurrentSettings(offCtx); // Apply to offscreen
          
          if (selectedTool === "rectangle") {
            drawRectangle(
              offCtx,
              shapeStartPosRef.current.x,
              shapeStartPosRef.current.y,
              endCoords.x,
              endCoords.y
            );
          } else if (selectedTool === "circle") {
            drawCircle(
              offCtx,
              shapeStartPosRef.current.x,
              shapeStartPosRef.current.y,
              endCoords.x,
              endCoords.y
            );
          }
        }
        redrawCanvas(); // Redraw main to show commited shape
      }

      // Reset state
      shapeStartPosRef.current = null;
      setIsManipulatingShape(false);
      setIsDrawing(false);
      
      saveToStorage(); // Autosave
    }, [
      isDrawing,
      isManipulatingShape,
      selectedTool,
      drawRectangle,
      drawCircle,
      applyCurrentSettings,
      lastPosition,
      redrawCanvas,
      saveToStorage
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

        // Setup Main Canvas
        canvas.width = backingStoreWidth;
        canvas.height = backingStoreHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        context.resetTransform();
        context.scale(dpr, dpr);

        // Setup Offscreen Canvas
        if (!offscreenCanvasRef.current) {
             offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offCtx = offscreenCanvasRef.current.getContext('2d');
        
        // If resizing, we might lose offscreen data if we don't save/restore it.
        // For simplicity, we just keep it if it's already there, or we might need to resize it too.
        // Let's resize offscreen if it's smaller.
        if (offscreenCanvasRef.current.width !== backingStoreWidth || offscreenCanvasRef.current.height !== backingStoreHeight) {
             // Save current content
             const tempCanvas = document.createElement('canvas');
             tempCanvas.width = offscreenCanvasRef.current.width;
             tempCanvas.height = offscreenCanvasRef.current.height;
             const tempCtx = tempCanvas.getContext('2d');
             if (offscreenCanvasRef.current.width > 0) {
                 tempCtx.drawImage(offscreenCanvasRef.current, 0, 0);
             }
             
             // Resize
             offscreenCanvasRef.current.width = backingStoreWidth;
             offscreenCanvasRef.current.height = backingStoreHeight;
             offCtx.resetTransform();
             offCtx.scale(dpr, dpr);
             
             // Restore
             // Fill background first if new
             if (initialSetup) {
                 fillCanvasBackground(offCtx, offscreenCanvasRef.current);
             } else {
                 fillCanvasBackground(offCtx, offscreenCanvasRef.current); // Fill with bg color
                 offCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width /dpr, tempCanvas.height /dpr); // Draw saved content on top? 
                 // Issue: scale diffs. Better to just fill background on init.
                 // If resizing, we really should just redraw the image we persisted or keep it.
             }
        }
        
        if (initialSetup) {
             fillCanvasBackground(offCtx, offscreenCanvasRef.current);
             fillCanvasBackground(context, canvas);
             loadFromStorage(context); // Load saved state on init
        } else {
             // Just redraw
             redrawCanvas();
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
    }, [applyCurrentSettings, fillCanvasBackground, drawObjects]);

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
        onDoubleClick={(e) => {
        if (!canEdit) return;
        const coords = getCoords(e);
        
        // Find hit on ANY object
        const hit = [...objectsRef.current].reverse().find((obj) => {
            if (obj.type === "text") {
               const context = contextRef.current;
               context.font = `${obj.fontSize}px ${obj.fontFamily}`;
               const metrics = context.measureText(obj.text);
               const width = metrics.width;
               const height = obj.fontSize; 
               return (
                coords.x >= obj.x &&
                coords.x <= obj.x + width + 8 &&
                coords.y >= obj.y - height &&
                coords.y <= obj.y + 8
               );
            } else {
              // Image object
              return (
                coords.x >= obj.x &&
                coords.x <= obj.x + obj.width &&
                coords.y >= obj.y &&
                coords.y <= obj.y + obj.height
              );
            }
        });

        if (hit) {
            // If not selected or tool not select, Select it!
            if (activeObjectId !== hit.id || selectedTool !== 'select') {
                setSelectedTool?.('select'); // Switch tool
                setActiveObjectId(hit.id);
                redrawCanvas();
                return;
            }

            // If ALREADY selected and Text -> Edit
            if (hit.type === 'text') {
                const newText = prompt("Редактировать текст:", hit.text);
                if (newText !== null) {
                  objectsRef.current = objectsRef.current.map((obj) =>
                    obj.id === hit.id ? { ...obj, text: newText } : obj
                  );
                  setObjects(objectsRef.current);
                  redrawCanvas();
                  saveToStorage();
                }
            }
        }
      }}
      />
    );
  }
);

export default CanvasComponent;
