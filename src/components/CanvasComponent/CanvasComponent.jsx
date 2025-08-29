import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import styles from './CanvasComponent.module.scss';

function hexToRgba(hex) {
    if (!hex) return [0, 0, 0, 0];
    let r = 0, g = 0, b = 0, a = 255;
    hex = hex.trim();
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16);
    } else if (hex.length === 9) {
        r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16); a = parseInt(hex[7] + hex[8], 16);
    } else { return [0, 0, 0, 0]; } // Invalid format
    return [isNaN(r)?0:r, isNaN(g)?0:g, isNaN(b)?0:b, isNaN(a)?255:a];
}


const CanvasComponent = forwardRef(({ selectedColor, lineWidth, selectedTool, theme }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false); // Mouse/Touch is down
  const [isManipulatingShape, setIsManipulatingShape] = useState(false); // If actively drawing a shape preview
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0}); // Track last position for stopDrawing shape finalization
  const drawingDataRef = useRef(null); // Stores ImageData for resize restoration
  const shapeStartPosRef = useRef(null); // Stores {x, y} for shape start
  const canvasSnapshotRef = useRef(null); // Stores ImageData before shape preview


  // --- Stable Callbacks (No dependencies on changing props/state) ---

  const fillCanvasBackground = useCallback((context, canvas, bgColor = null) => {
      if (!canvas || !context) return;
      const dpr = window.devicePixelRatio || 1;
      const color = bgColor || getComputedStyle(document.documentElement).getPropertyValue('--canvas-background').trim();
      const savedOperation = context.globalCompositeOperation;
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = color;
      // Use logical canvas size for fillRect when context is scaled
      context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      context.globalCompositeOperation = savedOperation;
  }, []);

  // Using the getCoords from the stable version provided
  const getCoords = useCallback((event) => {
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
         // Fallback to last known position if event data is missing
         // This might happen on mouseleave/touchend sometimes
         return lastPosition;
     }
     // Calculate position relative to the element's bounding box
     return { x: clientX - rect.left, y: clientY - rect.top };
  }, [lastPosition]); // Dependency is okay here

  const drawRectangle = useCallback((context, startX, startY, endX, endY) => {
      if (!context) return; context.strokeRect(startX, startY, endX - startX, endY - startY);
  }, []);

  const drawCircle = useCallback((context, startX, startY, endX, endY) => {
    if (!context) return;
    const radiusX = Math.abs(endX - startX) / 2; const radiusY = Math.abs(endY - startY) / 2;
    if (radiusX < 0.5 || radiusY < 0.5) return; // Avoid tiny/invalid ellipses
    const centerX = Math.min(startX, endX) + radiusX; const centerY = Math.min(startY, endY) + radiusY;
    context.beginPath(); context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI); context.stroke();
  }, []);


  // --- Callbacks Dependent on Props/State ---

  const applyCurrentSettings = useCallback((context) => {
     if (!context) return;
     const isEraser = selectedTool === 'eraser';
     context.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
     context.strokeStyle = selectedColor; context.fillStyle = selectedColor;
     context.lineWidth = lineWidth; context.lineCap = 'round'; context.lineJoin = 'round';
  }, [selectedColor, lineWidth, selectedTool]);

  const floodFill = useCallback((startX, startY) => {
    const canvas = canvasRef.current; const context = contextRef.current;
    if (!canvas || !context) return;
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width; const canvasHeight = canvas.height; // Backing store size
    // Scale logical coordinates to backing store coordinates for pixel manipulation
    startX = Math.floor(startX * dpr); startY = Math.floor(startY * dpr);
    if (startX < 0 || startX >= canvasWidth || startY < 0 || startY >= canvasHeight) return;

    let imageData; try { imageData = context.getImageData(0, 0, canvasWidth, canvasHeight); }
    catch (e) { console.error("Flood fill getImageData error:", e); return; }
    const data = imageData.data;
    const pixelIndex = (startY * canvasWidth + startX) * 4;
    const targetColor = [data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2], data[pixelIndex + 3]];
    const fillColorRgba = hexToRgba(selectedColor); if (!fillColorRgba) return;
    const fillColor = [fillColorRgba[0], fillColorRgba[1], fillColorRgba[2], fillColorRgba[3]];
    if (targetColor.every((val, i) => val === fillColor[i])) return;

    const queue = [[startX, startY]]; const visited = new Set([`${startX},${startY}`]);
    let iterations = 0; const maxIterations = canvasWidth * canvasHeight * 1.5; // Safety limit

    while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const [x, y] = queue.shift();
        const currentIndex = (y * canvasWidth + x) * 4;
        data[currentIndex] = fillColor[0]; data[currentIndex + 1] = fillColor[1];
        data[currentIndex + 2] = fillColor[2]; data[currentIndex + 3] = fillColor[3];
        [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
            if (nx >= 0 && nx < canvasWidth && ny >= 0 && ny < canvasHeight) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    const neighborIndex = (ny * canvasWidth + nx) * 4;
                    if (data[neighborIndex] === targetColor[0] && data[neighborIndex + 1] === targetColor[1] &&
                        data[neighborIndex + 2] === targetColor[2] && data[neighborIndex + 3] === targetColor[3]) {
                        visited.add(key); queue.push([nx, ny]);
                    }
                }
            }
        });
    }
    if (iterations >= maxIterations) console.warn("Flood fill iteration limit reached.");
    context.putImageData(imageData, 0, 0);
    try { drawingDataRef.current = context.getImageData(0, 0, canvasWidth, canvasHeight); }
    catch (e) { console.error("Error saving drawing data after fill:", e); drawingDataRef.current = null; }
  }, [selectedColor]);


  // --- Exposed Methods ---
  const clearCanvas = useCallback(() => {
    const ctx = contextRef.current; const cnv = canvasRef.current;
    if (ctx && cnv) { fillCanvasBackground(ctx, cnv); drawingDataRef.current = null; canvasSnapshotRef.current = null; }
  }, [fillCanvasBackground]);

  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-background').trim();
    const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvas.width; tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d'); tempCtx.fillStyle = bgColor; tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0); try { const dataUrl = tempCanvas.toDataURL('image/png'); const link = document.createElement('a');
    link.href = dataUrl; link.download = 'paint-again-drawing.png'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
    catch (error) { console.error("Download failed:", error); alert("Could not download image."); }
  }, []);

  useImperativeHandle(ref, () => ({ clearCanvas, downloadImage }), [clearCanvas, downloadImage]);


  // --- Modified Event Handlers ---

  const startDrawing = useCallback((event) => {
    // No preventDefault here if attached directly to JSX element (React handles it)
    // However, if using addEventListener, it *is* needed with passive: false
    if (event.button > 0 || !contextRef.current) return; // Ignore right clicks
    const context = contextRef.current;
    const coords = getCoords(event); // Use logical coordinates
    applyCurrentSettings(context);
    setIsDrawing(true);
    setLastPosition(coords); // Store logical coordinates

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
        context.beginPath();
        context.moveTo(coords.x, coords.y); // Start path at logical coordinates
    } else if (selectedTool === 'rectangle' || selectedTool === 'circle') {
        setIsManipulatingShape(true);
        shapeStartPosRef.current = coords; // Store logical start coordinates
        try {
            // Get snapshot based on backing store size
            canvasSnapshotRef.current = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        } catch (e) {
            console.error("Snapshot error:", e);
            canvasSnapshotRef.current = null; setIsManipulatingShape(false); // Abort if snapshot fails
        }
    } else if (selectedTool === 'bucket') {
        floodFill(coords.x, coords.y); // Pass logical coordinates to flood fill
        setIsDrawing(false); // Instant action
    }
  }, [applyCurrentSettings, getCoords, selectedTool, floodFill]); // Dependencies

  const draw = useCallback((event) => {
    // No preventDefault here if attached directly to JSX element
    if (!isDrawing || !contextRef.current) return;
    const context = contextRef.current;
    const coords = getCoords(event); // Get logical coordinates

    if ((selectedTool === 'pen' || selectedTool === 'eraser') && !isManipulatingShape) {
        context.lineTo(coords.x, coords.y); // Draw to logical coordinates
        context.stroke();
        setLastPosition(coords); // Update last logical position
    } else if ((selectedTool === 'rectangle' || selectedTool === 'circle') && isManipulatingShape) {
        if (!canvasSnapshotRef.current || !shapeStartPosRef.current) return;
        context.putImageData(canvasSnapshotRef.current, 0, 0); // Restore snapshot
        applyCurrentSettings(context); // Re-apply style for preview
        // Draw preview using logical coordinates
        if (selectedTool === 'rectangle') {
            drawRectangle(context, shapeStartPosRef.current.x, shapeStartPosRef.current.y, coords.x, coords.y);
        } else if (selectedTool === 'circle') {
            drawCircle(context, shapeStartPosRef.current.x, shapeStartPosRef.current.y, coords.x, coords.y);
        }
        setLastPosition(coords); // Update last logical position for stopDrawing
    }
  }, [isDrawing, isManipulatingShape, getCoords, selectedTool, drawRectangle, drawCircle, applyCurrentSettings]); // Dependencies

  const stopDrawing = useCallback(() => {
    // No event needed if attached directly to JSX element
    if (!isDrawing || !contextRef.current) return;
    const context = contextRef.current;

    if (isManipulatingShape && (selectedTool === 'rectangle' || selectedTool === 'circle')) {
        if (canvasSnapshotRef.current && shapeStartPosRef.current) {
             context.putImageData(canvasSnapshotRef.current, 0, 0); // Restore before final draw
             const endCoords = lastPosition; // Use the last position state
             applyCurrentSettings(context);
             // Draw final shape using logical coordinates
             if (selectedTool === 'rectangle') {
                 drawRectangle(context, shapeStartPosRef.current.x, shapeStartPosRef.current.y, endCoords.x, endCoords.y);
             } else if (selectedTool === 'circle') {
                 drawCircle(context, shapeStartPosRef.current.x, shapeStartPosRef.current.y, endCoords.x, endCoords.y);
             }
        }
    }

    // Reset shape state/refs AFTER potential final draw
    canvasSnapshotRef.current = null;
    shapeStartPosRef.current = null;
    setIsManipulatingShape(false);
    setIsDrawing(false); // Mouse/touch is up

    // Save final canvas state using backing store size
    try {
       drawingDataRef.current = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    } catch(e) {
        console.error("Error saving final drawing data:", e);
        drawingDataRef.current = null;
    }
  }, [isDrawing, isManipulatingShape, selectedTool, drawRectangle, drawCircle, applyCurrentSettings, lastPosition]); // Dependencies


  // --- Effect for ONE-TIME Setup and Resize Handling (Using the version you provided) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    // Get context, potentially hint for performance
    const context = canvas.getContext('2d', { willReadFrequently: true });
    contextRef.current = context;
    let animationFrameId = null;

    const setCanvasDimensions = (initialSetup = false) => {
        if (!canvas.parentElement) return;
        const dpr = window.devicePixelRatio || 1;
        // Use parent size from getBoundingClientRect as in your stable version
        const { width, height } = canvas.parentElement.getBoundingClientRect();
        const displayWidth = Math.floor(width);
        const displayHeight = Math.floor(height);
        const backingStoreWidth = Math.floor(width * dpr);
        const backingStoreHeight = Math.floor(height * dpr);

        // Check if resize is actually needed (same check as your stable version)
        if (!initialSetup && canvas.width === backingStoreWidth && canvas.height === backingStoreHeight) {
            return;
        }

        const savedDrawing = drawingDataRef.current; // Use ref, same as your stable version

        // Set attributes AND style width/height, as in your stable version
        canvas.width = backingStoreWidth;
        canvas.height = backingStoreHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Reset transform and scale fresh each time for clarity
        context.resetTransform();
        context.scale(dpr, dpr);

        // Fill background AFTER scaling
        fillCanvasBackground(context, canvas);

        // Restore the drawing if it exists (using putImageData, same as your stable version)
        if (savedDrawing) {
            try {
                // Create temp canvas to put old data, then drawImage onto main canvas
                // This part needs adjustment to work correctly with putImageData restoration
                 const tempC = document.createElement('canvas');
                 tempC.width = savedDrawing.width;
                 tempC.height = savedDrawing.height;
                 tempC.getContext('2d').putImageData(savedDrawing, 0, 0);
                 // Draw the saved image onto the potentially scaled context
                 // Draw onto the logical coordinate space
                 context.drawImage(tempC, 0, 0, displayWidth, displayHeight);
            } catch(e) {
                console.error("Restore error:", e);
                drawingDataRef.current = null;
            }
        }

        // Apply current tool settings (same as your stable version)
        applyCurrentSettings(context);
    };

    // Initial setup call
    setCanvasDimensions(true);

    const parentElement = canvas.parentElement;
    // Observe parent element, as in your stable version
    const resizeObserver = new ResizeObserver(() => {
        if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        animationFrameId = window.requestAnimationFrame(() => setCanvasDimensions(false));
    });
    if (parentElement) { resizeObserver.observe(parentElement); }

    // Cleanup function (same as your stable version)
    return () => {
       if (parentElement) resizeObserver.unobserve(parentElement);
       if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
    // Dependencies should match your stable version or be minimal
  }, [applyCurrentSettings, fillCanvasBackground]); // Stick to stable dependencies


  // --- Effect to Apply Settings when Props Change ---
  useEffect(() => {
    // Apply settings only if context exists and not currently drawing a shape preview
    if (contextRef.current && !isManipulatingShape) {
        applyCurrentSettings(contextRef.current);
    }
    // Re-run when tool/style props change, or when shape manipulation finishes
  }, [selectedColor, lineWidth, selectedTool, applyCurrentSettings, isManipulatingShape]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.paintCanvas}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing} // Stop drawing if mouse leaves canvas
      // Touch events - These might trigger passive listener warnings/errors
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      onTouchCancel={stopDrawing} // Handle interruptions
    />
  );
});

export default CanvasComponent;

// Created by Ram Bapat, www.linkedin.com/in/ram-bapat-barrsum-diamos