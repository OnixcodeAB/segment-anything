import { useContext, useState } from "react";
import * as _ from "underscore";
import type { modelInputProps, boxInputProps } from "./helpers/interfaces";
import AppContext from "./hooks/context";
import { Tool } from "./Tool";

type InteractionMode = "hover" | "box";

export const Stage = () => {
  const {
    clicks: [, setClicks],
    boxes: [, setBoxes],
    image: [image],
  } = useContext(AppContext)!;

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<InteractionMode>("hover");

  const getClick = (x: number, y: number): modelInputProps => {
    const clickType = 1; // 1 for positive, 0 for negative
    return { x, y, clickType };
  };

  const getBox = (
    x: number,
    y: number,
    width: number,
    height: number
  ): boxInputProps => {
    return { x, y, width, height };
  };

  const getScaledCoordinates = (e: any) => {
    let el = e.nativeEvent.target;
    const rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const imageScale = image ? image.width / el.offsetWidth : 1;
    return {
      x: x * imageScale,
      y: y * imageScale,
    };
  };

  const handleMouseDown = (e: any) => {
    if (mode !== "box") return;

    const { x, y } = getScaledCoordinates(e);
    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseUp = (e: any) => {
    if (mode !== "box" || !isDrawing) return;

    const { x, y } = getScaledCoordinates(e);

    const width = Math.abs(x - startPos.x);
    const height = Math.abs(y - startPos.y);
    const minX = Math.min(x, startPos.x);
    const minY = Math.min(y, startPos.y);

    const box = getBox(minX, minY, width, height);
    setBoxes([box]);
    setIsDrawing(false);
  };

  const handleMouseMove = _.throttle((e: any) => {
    if (mode !== "hover") return;

    const { x, y } = getScaledCoordinates(e);
    const click = getClick(x, y);
    if (click) {
      setClicks([click]);
    }
  }, 15);

  const flexCenterClasses = "flex items-center justify-center";

  return (
    <div className={`${flexCenterClasses} w-full h-full flex-col`}>
      {/* Mode selection buttons */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-4 py-2 rounded-md ${
            mode === "hover" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setMode("hover")}
        >
          Hover Mode
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-md ${
            mode === "box" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setMode("box")}
        >
          Box Draw Mode
        </button>
      </div>

      {/* Tool container */}
      <div className={`${flexCenterClasses} w-full h-[calc(100%-3rem)]`}>
        <div
          className={`${flexCenterClasses} relative w-[90%] h-[90%]`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <Tool
            handleMouseMove={mode === "hover" ? handleMouseMove : undefined}
            isDrawing={isDrawing}
            startPos={mode === "box" ? startPos : undefined}
            currentPos={
              mode === "box" && isDrawing ? getScaledCoordinates : undefined
            }
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};
