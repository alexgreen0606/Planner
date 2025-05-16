import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';

// Each page gets a collection of unique functions to reload the page data
type ReloadMap = Record<
    string, // the path of the current page
    Record<string, () => Promise<void>>
>;

interface ReloadProviderProps {
    children: React.ReactNode;
}

interface ReloadContextType {
    registerReloadFunction: (
        functionId: string,
        reloadFunc: () => Promise<void>,
        path: string
    ) => void;
    reloadPage: () => Promise<void>;
    canReloadPath: boolean;
}

const ReloadContext = createContext<ReloadContextType | null>(null);

export const ReloadProvider: React.FC<ReloadProviderProps> = ({
    children,
}) => {
    const reloadMap = useRef<ReloadMap>({} as ReloadMap);
    const currentPath = usePathname();
    const [canReloadPath, setCanReloadPath] = useState(false);

    useEffect(() => {
        setCanReloadPath(!!reloadMap.current[currentPath]);
    }, [currentPath]);

    // Register a function for a specific page
    function registerReloadFunction(
        functionId: string,
        reloadFunc: () => Promise<void>,
        path: string
    ) {
        reloadMap.current = {
            ...reloadMap.current,
            [path]: {
                ...reloadMap.current[path],
                [functionId]: reloadFunc
            },
        };
    };

    // Execute all registered functions for a specific page
    async function reloadPage() {
        const reloadFunctionsMap = reloadMap.current[currentPath];
        if (!reloadFunctionsMap) return;

        try {
            await Promise.all(Object.values(reloadFunctionsMap).map(func => func()));
        } catch (error) {
            console.error('Error during reload:', error);
        }
    };

    return (
        <ReloadContext.Provider value={{
            registerReloadFunction,
            reloadPage,
            canReloadPath
        }}>
            {children}
        </ReloadContext.Provider>
    );
};

export const useReloadScheduler = () => {
    const context = useContext(ReloadContext);
    if (!context) {
        throw new Error("useReload must be used within a ReloadProvider");
    }
    return context;
};