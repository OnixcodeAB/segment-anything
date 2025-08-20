import * as ort from "onnxruntime-web";

export interface contextProps {
  clicks: [
    clicks: modelInputProps[] | null,
    setClicks: (e: modelInputProps[] | null) => void
  ];
  box: [box: boxInputProps | null, setBoxes: (e: boxInputProps | null) => void];
  mode: [mode: modeProps, setMode: (e: modeProps) => void];
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
  box?: boxInputProps | null;
  tensor: ort.Tensor;
  modelScale: modelScaleProps;
}

export interface modeProps {
  mode: "hover" | "box";
}

export interface ToolProps {
  mode: modeProps["mode"];
  handleMouseMove?: (e: any) => void;
  handleMouseDown?: (e: any) => void;
  handleMouseUp?: (e: any) => void;
  handleMouseOut?: (e: any) => void;
  handleBoxMouseMove?: (e: any) => void;
  boxCoords?: boxInputProps | null;
}
