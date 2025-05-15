import React, { createContext, useContext, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DimensionsContextType = {
  SCREEN_WIDTH: number;
  SCREEN_HEIGHT: number;
  TOP_SPACER: number;
  BOTTOM_SPACER: number;
};

const DimensionsContext = createContext<DimensionsContextType | undefined>(undefined);

export const DimensionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();

  const value: DimensionsContextType = {
    SCREEN_WIDTH: width,
    SCREEN_HEIGHT: height,
    TOP_SPACER: top,
    BOTTOM_SPACER: bottom,
  };

  return (
    <DimensionsContext.Provider value={value}>
      {children}
    </DimensionsContext.Provider>
  );
};

export const useDimensions = (): DimensionsContextType => {
  const context = useContext(DimensionsContext);
  if (context === undefined) {
    throw new Error("useDimensions must be used within a DimensionsProvider");
  }
  return context;
};
