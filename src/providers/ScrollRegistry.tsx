import React, { createContext, useContext, useRef } from 'react';
import { SharedValue } from 'react-native-reanimated';

type TScrollRegistry = {
  get: (key: string) => SharedValue<number> | undefined;
  set: (key: string, v: SharedValue<number>) => void;
};

const ScrollRegistryContext = createContext<TScrollRegistry | undefined>(undefined);

export const ScrollRegistryProvider = ({ children }: { children: React.ReactNode }) => {
  const registry = useRef<Map<string, SharedValue<number>>>(new Map());
  return <ScrollRegistryContext.Provider value={{
    get: (key) => registry.current.get(key),
    set: (key, v) => registry.current.set(key, v)
  }}>{children}</ScrollRegistryContext.Provider>;
};

export const useScrollRegistry = () => useContext(ScrollRegistryContext)!;
