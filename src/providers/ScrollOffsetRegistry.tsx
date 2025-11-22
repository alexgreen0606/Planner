import React, { createContext, useContext, useRef } from 'react';
import { SharedValue } from 'react-native-reanimated';

type TScrollOffsetRegistry = {
    get: (key: string) => SharedValue<number> | undefined;
    set: (key: string, v: SharedValue<number>) => void;
};

const ScrollOffsetRegistryContext = createContext<TScrollOffsetRegistry | undefined>(undefined);

export const ScrollOffsetRegistryProvider = ({ children }: { children: React.ReactNode }) => {
    const registry = useRef<Map<string, SharedValue<number>>>(new Map());
    return (
        <ScrollOffsetRegistryContext.Provider value={{
            get: (key) => registry.current.get(key),
            set: (key, v) => registry.current.set(key, v)
        }}>
            {children}
        </ScrollOffsetRegistryContext.Provider>
    );
};

export const useScrollOffsetRegistry = () => useContext(ScrollOffsetRegistryContext)!;