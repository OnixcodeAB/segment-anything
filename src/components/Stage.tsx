import { useContext } from "react";
import * as _ from "underscore";
import type { modelInputProps } from "./helpers/interfaces";
import AppContext from "./hooks/context";
import { Tool } from "./Tool";

export const Stage = () => {
  const {
    clicks: [, setClicks],
    image: [image],
  } = useContext(AppContext)!;
  const getClick = (x: number, y: number): modelInputProps => {
    const clickType = 1; // 1 for positive, 0 for negative
    return { x, y, clickType };
  };

  // Get mouse position and scale the (x, y) coordinates back to the natural
  // scale of the image. Update the state of clicks with setClicks to trigger
  // the ONNX model to run and generate a new mask via a useEffect in App.tsx

  const handleMouseMove = _.throttle((e: any) => {
    let el = e.nativeEvent.target;
    const rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left; // x position within the element
    let y = e.clientY - rect.top; // y position within the element

    const imageScale = image ? image.width / el.offsetWidth : 1;
    x *= imageScale;
    y *= imageScale;
    const click = getClick(x, y);
    if (click) {
        //console.log({click})
      setClicks([click]);
    }
  }, 15);

  //const flexCenterClasses = "flex justify-center items-center h-full w-full";
  const flexCenterClasses = "flex items-center justify-center";

  return (
    <div className={`${flexCenterClasses} w-full h-full`}>
      <div className={`${flexCenterClasses} relative w-[90%] h-[90%]`}>
        <Tool handleMouseMove={handleMouseMove} />
      </div>
    </div>
  );
};
