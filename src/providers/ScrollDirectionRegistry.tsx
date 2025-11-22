import React, { createContext, useContext, useState } from 'react';

type TScrollDirectionRegistry = {
    scrollDirectionMap: TScrollDirectionMap;
    onTrackIsScrollingDown: (key: string, isScrollingDown: boolean) => void;
};

type TScrollDirectionMap = Record<string, boolean>;

const ScrollDirectionRegistryContext = createContext<TScrollDirectionRegistry | undefined>(undefined);

export const ScrollDirectionRegistryProvider = ({ children }: { children: React.ReactNode }) => {
    const [scrollDirectionMap, setScrollDirectionMap] = useState<TScrollDirectionMap>({});
    return (
        <ScrollDirectionRegistryContext.Provider value={{
            scrollDirectionMap,
            onTrackIsScrollingDown: (key, v) => setScrollDirectionMap((prev) => ({ ...prev, [key]: v }))
        }}>
            {children}
        </ScrollDirectionRegistryContext.Provider>
    );
};

export const useScrollDirectionRegistry = () => useContext(ScrollDirectionRegistryContext)!;
