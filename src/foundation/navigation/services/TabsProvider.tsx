import React, { createContext, useContext, useState } from 'react';

interface NavigatorContextValue {
    currentTab: string;
    setCurrentTab: (newTab: string) => void;
}

const NavigatorContext = createContext<NavigatorContextValue | null>(null);

export const NavigatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTab, setCurrentTab] = useState<string>('dashboard');

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
