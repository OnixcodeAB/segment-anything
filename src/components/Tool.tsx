import { useContext, useEffect, useState, useRef } from "react";
import * as _ from "underscore";
import AppContext from "./hooks/context";
import type { ToolProps } from "./helpers/interfaces";

export const Tool = ({
  mode,
  handleMouseMove,
  handleMouseDown,
  handleMouseUp,
  handleMouseOut,
  handleBoxMouseMove,
  boxCoords,
}: ToolProps) => {
  const {
    image: [image],
    maskImg: [maskImg, setMaskImg],
  } = useContext(AppContext)!;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [shouldFitToWidth, setShouldFitToWidth] = useState(true);
  const bodyEl = document.body;

  const fitToPage = () => {
    if (!image) return;
    const imageAspectRatio = image.width / image.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    setShouldFitToWidth(imageAspectRatio > screenAspectRatio);
  };

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === bodyEl) {
        fitToPage();
      }
    }
  });

  useEffect(() => {
    fitToPage();
    resizeObserver.observe(bodyEl);
    return () => {
      resizeObserver.unobserve(bodyEl);
    };
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !boxCoords || !image || mode !== "box") {
      const ctx = canvas?.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas on mode change or no box
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bounding box drawing logic remains the same
    const { x, y, width, height } = boxCoords;
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
  }, [boxCoords, image, mode]);

  const imageClasses = "";
  const maskImageClasses = "absolute opacity-40 pointer-events-none";

  return (
    <>
      {image && (
        <div className={`relative ${shouldFitToWidth ? "w-full" : "h-full"}`}>
          <img
            aria-label="input image"
            onMouseMove={mode === "hover" ? handleMouseMove : undefined}
            onMouseOut={
              mode === "hover"
                ? () => _.defer(() => setMaskImg(null))
                : undefined
            }
            onTouchStart={mode === "hover" ? handleMouseMove : undefined}
            src={image.src}
            className={`${
              shouldFitToWidth ? "w-full" : "h-full"
            } ${imageClasses}`}
          ></img>
          {mode === "box" && (
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleBoxMouseMove}
              onMouseOut={handleMouseOut}
            ></canvas>
          )}
        </div>
      )}
      {maskImg && (
        <img
          aria-label="segmentation mask"
          src={maskImg.src}
          className={`${
            shouldFitToWidth ? "w-full" : "h-full"
          } ${maskImageClasses}`}
        ></img>
      )}
    </>
  );
};
