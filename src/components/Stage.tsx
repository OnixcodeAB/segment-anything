import { useContext, useState } from "react";
import * as _ from "underscore";
import type {
  modelInputProps,
  ToolProps,
  boxInputProps,
} from "./helpers/interfaces";
import AppContext from "./hooks/context";
import { Tool } from "./Tool";

export const Stage = () => {
  const {
    clicks: [, setClicks],
    box: [box, setBox],
    image: [image],
  } = useContext(AppContext)!;

  const [mode, setMode] = useState<ToolProps["mode"]>("hover"); // 'hover' or 'box'
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCoords, setStartCoords] = useState<number[] | null>(null);
  const [drawBoxCoords, setDrawBoxCoords] = useState<boxInputProps | null>(
    null
  ); // New state for drawing

  const getClick = (
    x: number,
    y: number,
    clickType: number
  ): modelInputProps => {
    return { x, y, clickType };
  };

  const scaleCoordinates = (x: number, y: number, el: any) => {
    const rect = el.getBoundingClientRect();
    const imageScale = image ? image.width / el.offsetWidth : 1;
    return {
      x: (x - rect.left) * imageScale,
      y: (y - rect.top) * imageScale,
    };
  };

  const handleMouseMove = _.throttle((e: any) => {
    if (mode !== "hover") return;
    const { x, y } = scaleCoordinates(
      e.clientX,
      e.clientY,
      e.nativeEvent.target
    );
    const click = getClick(x, y, 1);
    if (click) {
      setClicks([click]);
    }
  }, 15);

  const handleMouseDown = (e: any) => {
    if (mode !== "box") return;
    setBox(null); // Reset box when starting a new draw
    setClicks([]); // Clear previous clicks
    const { x, y } = scaleCoordinates(
      e.clientX,
      e.clientY,
      e.nativeEvent.target
    );
    setStartCoords([x, y]);
    setIsDrawing(true);
  };

  const handleMouseUp = (e: any) => {
    if (!isDrawing || mode !== "box") return;
    const { x, y } = scaleCoordinates(
      e.clientX,
      e.clientY,
      e.nativeEvent.target
    );

    // Calculate width and height
    const newBox: boxInputProps = {
      x: Math.min(startCoords![0], x),
      y: Math.min(startCoords![1], y),
      width: Math.abs(x - startCoords![0]),
      height: Math.abs(y - startCoords![1]),
    };

    setBox(newBox);
    setDrawBoxCoords(null); // Clear the local drawing state
    setIsDrawing(false);
    setStartCoords(null);
  };

  const handleMouseOut = () => {
    if (isDrawing || mode !== "hover") return;
    setClicks([]);
  };

  const handleBoxMouseMove = (e: any) => {
    if (!isDrawing || mode !== "box") return;
    const { x, y } = scaleCoordinates(
      e.clientX,
      e.clientY,
      e.nativeEvent.target
    );

    // Update local state for visual feedback
    const tempBox: boxInputProps = {
      x: startCoords![0],
      y: startCoords![1],
      width: x - startCoords![0],
      height: y - startCoords![1],
    };
    setDrawBoxCoords(tempBox);
  };

  const flexCenterClasses = "flex items-center justify-center";

  return (
    <div className={`${flexCenterClasses} w-full h-full`}>
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button
          type="button"
          onClick={() => {
            setMode("hover");
            setBox(null);
          }}
          className={`px-4 py-2 rounded ${
            mode === "hover" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Hover Mode
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("box");
            setBox(null);
          }}
          className={`px-4 py-2 rounded ${
            mode === "box" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Box Mode
        </button>
      </div>
      <div className={`${flexCenterClasses} relative w-[90%] h-[90%]`}>
        <Tool
          mode={mode}
          handleMouseMove={handleMouseMove}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
          handleMouseOut={handleMouseOut}
          handleBoxMouseMove={handleBoxMouseMove}
          boxCoords={drawBoxCoords}
        />
      </div>
    </div>
  );
};
