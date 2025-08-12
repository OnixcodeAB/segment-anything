import { createContext, useState } from "react";
import type { contextProps, modelInputProps } from "../helpers/interfaces";

const AppContext = createContext<contextProps | null>(null);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [clicks, setClicks] = useState<Array<modelInputProps> | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);

  return (
    <AppContext.Provider
      value={{
        clicks: [clicks, setClicks],
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