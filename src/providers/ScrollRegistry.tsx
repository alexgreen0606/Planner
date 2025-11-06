import React, { createContext, useContext, useRef } from 'react';
import { SharedValue } from 'react-native-reanimated';

type ScrollRegistry = {
  get: (key: string) => SharedValue<number> | undefined;
  set: (key: string, v: SharedValue<number>) => void;
};

const ScrollRegistryContext = createContext<ScrollRegistry | null>(null);

export const ScrollRegistryProvider = ({ children }: { children: React.ReactNode }) => {
  const registry = useRef<Map<string, SharedValue<number>>>(new Map());

  const api: ScrollRegistry = {
    get: (key) => registry.current.get(key),
    set: (key, v) => registry.current.set(key, v)
  };

  return <ScrollRegistryContext.Provider value={api}>{children}</ScrollRegistryContext.Provider>;
};

export const useScrollRegistry = () => useContext(ScrollRegistryContext)!;
