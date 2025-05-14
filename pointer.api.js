/*!
 * web-touch-points refactored for Pointer Events API
 * Supports an unlimited number of simultaneous touch points (limited only by hardware)
 * By: [Your Name], 2025
 */

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("touchDisplayCanvas");
  if (!canvas) {
    console.error("Canvas element #touchDisplayCanvas not found");
    return;
  }

  // Prevent default touch gestures (scroll, zoom, etc.)
  canvas.style.touchAction = "none";                     // :contentReference[oaicite:0]{index=0}

  const ctx = canvas.getContext("2d");
  const activePointers = new Map();

  // Register pointer event handlers
  ["pointerdown", "pointermove", "pointerup", "pointercancel"].forEach(type =>
    canvas.addEventListener(type, handlePointerEvent)
  );

  /**
   * Handle all pointer events on the canvas.
   * Filters to touch pointers and updates our activePointers map.
   */
  function handlePointerEvent(evt) {
    if (evt.pointerType !== "touch") return;             // :contentReference[oaicite:1]{index=1}

    switch (evt.type) {
      case "pointerdown":
        activePointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
        break;
      case "pointermove":
        if (activePointers.has(evt.pointerId)) {
          activePointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });
        }
        break;
      case "pointerup":
      case "pointercancel":
        activePointers.delete(evt.pointerId);
        break;
    }

    drawTouches();
  }

  /**
   * Clears the canvas and draws a marker for each active touch.
   */
  function drawTouches() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let index = 0;
    for (const { x, y } of activePointers.values()) {
      drawCircle(x, y, index++);
    }
  }

  /**
   * Draws a numbered circle at the specified coordinates.
   * @param {number} x - The x‐coordinate on the canvas
   * @param {number} y - The y‐coordinate on the canvas
   * @param {number} idx - The touch index (for labeling)
   */
  function drawCircle(x, y, idx) {
    const radius = 20;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 150, 250, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "#0096fa";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#003f5c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(idx + 1, x, y);                         // :contentReference[oaicite:2]{index=2}
  }

  // Log the browser’s advertised max touch points (for debugging)
  console.log("Browser maxTouchPoints:", navigator.maxTouchPoints);  
                                                         // :contentReference[oaicite:3]{index=3}
});
