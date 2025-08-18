import { useContext, useEffect, useState, useRef } from "react";
import * as _ from "underscore";
import AppContext from "./hooks/context";
import type { ToolProps } from "./helpers/interfaces";

export const Tool = ({ 
  handleMouseMove, 
  isDrawing, 
  startPos, 
  currentPos,
  mode 
}: ToolProps) => {
  const {
    image: [image],
    maskImg: [maskImg, setMaskImg],
  } = useContext(AppContext)!;

  const imageRef = useRef<HTMLImageElement>(null);
  const [shouldFitToWidth, setShouldFitToWidth] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const bodyEl = document.body;

  // Calculate scaling factor based on image display size vs natural size
  const calculateScale = () => {
    if (!imageRef.current || !image) return 1;
    return imageRef.current.clientWidth / image.width;
  };

  const fitToPage = () => {
    if (!image) return;
    const imageAspectRatio = image.width / image.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    setShouldFitToWidth(imageAspectRatio > screenAspectRatio);
    setScaleFactor(calculateScale());
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

  const handleMousePosition = (e: React.MouseEvent) => {
    if (!image) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });

    if (handleMouseMove) {
      handleMouseMove(e);
    }
  };

  // Convert scaled coordinates to display coordinates
  const getDisplayBoxDimensions = () => {
    if (!isDrawing || !startPos || !currentPos || !imageRef.current) return null;
    
    const start = typeof startPos === "function" ? startPos() : startPos;
    if (!start) return null;
    const { x: startX, y: startY } = start;
    const current = typeof currentPos === "function" ? currentPos() : currentPos;
    if (!current) return null;
    const { x: endX, y: endY } = current;
    
    // Apply the inverse scale to convert from image coordinates to display coordinates
    const scale = calculateScale();
    
    return {
      left: Math.min(startX, endX) * scale,
      top: Math.min(startY, endY) * scale,
      width: Math.abs(endX - startX) * scale,
      height: Math.abs(endY - startY) * scale,
    };
  };

  const boxDimensions = getDisplayBoxDimensions();
  const imageClasses = "";
  const maskImageClasses = "absolute opacity-40 pointer-events-none";
  const boxPreviewClasses = "absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none";

  return (
    <>
      {image && (
        <div className="relative w-full h-full">
          <img
            ref={imageRef}
            aria-label="input image"
            onMouseMove={handleMousePosition}
            onMouseOut={() => _.defer(() => setMaskImg(null))}
            onTouchStart={handleMouseMove}
            src={image.src}
            className={`${
              shouldFitToWidth ? "w-full" : "h-full"
            } ${imageClasses} ${mode === 'hover' ? 'cursor-crosshair' : 'cursor-default'}`}
          />
          
          {/* Box drawing preview - positioned exactly over the image */}
          {mode === 'box' && isDrawing && boxDimensions && (
            <div
              className={boxPreviewClasses}
              style={{
                left: `${boxDimensions.left}px`,
                top: `${boxDimensions.top}px`,
                width: `${boxDimensions.width}px`,
                height: `${boxDimensions.height}px`,
              }}
            />
          )}

          {/* Current cursor position indicator */}
          {mode === 'hover' && (
            <div
              className="absolute w-2 h-2 bg-red-500 rounded-full pointer-events-none transform -translate-x-1 -translate-y-1"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
              }}
            />
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
        />
      )}
    </>
  );
};