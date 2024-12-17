import React, { createContext, useContext, useState } from 'react';

interface FolderContextValue {
    currentTab: string;
    setCurrentTab: (newTab: string) => void;
}

const TabsContext = createContext<FolderContextValue | null>(null);

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTab, setCurrentTab] = useState<string>('dashboard');

    return (
        <TabsContext.Provider
            value={{
                currentTab,
                setCurrentTab
            }}>
            {children}
        </TabsContext.Provider>
    );
};

export const useTabsContext = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error("useTabsContext must be used within an ApiProvider");
    }
    return context;
};
