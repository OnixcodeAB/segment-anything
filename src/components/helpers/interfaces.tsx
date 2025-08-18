import * as ort from "onnxruntime-web";

export interface contextProps {
  clicks: [
    clicks: modelInputProps[] | null,
    setClicks: (e: modelInputProps[] | null) => void
  ];
  boxes: [
    boxes: boxInputProps[] | null,
    setBoxes: (e: boxInputProps[] | null) => void
  ];
  image: [
    image: HTMLImageElement | null,
    setImage: (e: HTMLImageElement | null) => void
  ];
  maskImg: [
    maskImg: HTMLImageElement | null,
    setMaskImg: (e: HTMLImageElement | null) => void
  ];
}

export interface modelScaleProps {
  samScale: number;
  height: number;
  width: number;
}

export interface modelInputProps {
  x: number;
  y: number;
  clickType: number;
}

export interface boxInputProps {
  // Define the properties for boxInputProps as needed, for example:
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface modeDataProps {
  clicks?: Array<modelInputProps>;
  tensor: ort.Tensor;
  modelScale: modelScaleProps;
}

export interface ToolProps {
  handleMouseMove: (e: any) => void;
  isDrawing?: boolean;
    startPos?: { x: number; y: number } | (() => { x: number; y: number });
  currentPos?: { x: number; y: number } | (() => { x: number; y: number });
  mode?: "hover" | "box";
}
