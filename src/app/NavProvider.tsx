import React, { createContext, useContext, useState } from 'react';
import { Pages } from './navUtils';

interface NavigatorContextValue {
    currentTab: string;
    setCurrentTab: (newTab: Pages) => void;
}

const NavigatorContext = createContext<NavigatorContextValue | null>(null);

export const NavigatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTab, setCurrentTab] = useState<Pages>(Pages.DASHBOARD);

    return (
        <NavigatorContext.Provider
            value={{
                currentTab,
                setCurrentTab
            }}>
            {children}
        </NavigatorContext.Provider>
    );
};

export const useNavigatorContext = () => {
    const context = useContext(NavigatorContext);
    if (!context) {
        throw new Error("useNavigatorContext must be used within a Provider");
    }
    return context;
};
