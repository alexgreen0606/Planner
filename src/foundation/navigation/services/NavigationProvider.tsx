import React, { createContext, useContext, useState, useRef } from 'react';
import { Screens } from '../constants';

// Each page gets a collection of unique functions to reload the page data
type ReloadMap = Record<
    Screens,
    Record<string, () => Promise<void>>
>;

interface NavigationProviderProps {
    children: React.ReactNode;
}

interface NavigationContextType {
    currentScreen: Screens;
    setCurrentScreen: (newTab: Screens) => void;
    registerReloadFunction: (functionId: string, reloadFunc: () => Promise<void>) => void;
    reloadCurrentPage: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
    children,
}) => {
    const reloadMap = useRef<ReloadMap>({} as ReloadMap);
    const [currentScreen, setCurrentScreen] = useState<Screens>(Screens.DASHBOARD);

    // Register a function for a specific page
    function registerReloadFunction(
        functionId: string,
        reloadFunc: () => Promise<void>
    ) {
        reloadMap.current = {
            ...reloadMap.current,
            [currentScreen]: {
                ...reloadMap.current[currentScreen],
                [functionId]: reloadFunc
            },
        };
    };

    // Execute all registered functions for a specific page
    async function reloadCurrentPage() {
        const reloadFunctionsMap = reloadMap.current[currentScreen];
        if (!reloadFunctionsMap) return;

        try {
            await Promise.all(Object.values(reloadFunctionsMap).map(func => func()));
        } catch (error) {
            console.error('Error during reload:', error);
        }
    };

    return (
        <NavigationContext.Provider value={{
            currentScreen,
            setCurrentScreen,
            registerReloadFunction,
            reloadCurrentPage,
        }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error("useReload must be used within a ReloadProvider");
    }
    return context;
};