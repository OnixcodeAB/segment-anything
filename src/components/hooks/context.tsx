import { createContext, useState } from "react";
import type {
  boxInputProps,
  contextProps,
  modelInputProps,
  modeProps,
} from "../helpers/interfaces";

const AppContext = createContext<contextProps | null>(null);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [clicks, setClicks] = useState<Array<modelInputProps> | null>(null);
  const [box, setBox] = useState<boxInputProps | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<modeProps>({ mode: "hover" });

  return (
    <AppContext.Provider
      value={{
        clicks: [clicks, setClicks],
        box: [box, setBox],
        mode: [mode, setMode],
        image: [image, setImage],
        maskImg: [maskImg, setMaskImg],
      }}
    >
      {children}
      {/* Context values can be passed here if needed */}
    </AppContext.Provider>
  );
};

export default AppContext;
