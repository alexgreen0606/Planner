import React, { createContext, useContext, useState } from 'react';
import { FolderItem } from '../types';

interface FolderContextValue {
    setCurrentItem: (item: FolderItem | undefined) => void;
    currentItem: FolderItem | undefined;
}

const FolderContext = createContext<FolderContextValue | null>(null);

export const FolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentItem, setCurrentItem] = useState<FolderItem>(); // tracks the current textfield being moved

    return (
        <FolderContext.Provider
            value={{
                currentItem,
                setCurrentItem,
            }}>
            {children}
        </FolderContext.Provider>
    );
};

export const useFolderContext = () => {
    const context = useContext(FolderContext);
    if (!context) {
        throw new Error("useFoldersContext must be used within a Provider");
    }
    return context;
};
