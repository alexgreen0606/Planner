import React, { createContext, useContext, useState } from 'react';

interface CurrentList {
    id: string;
    numUpdates: number;
}

interface ListContextValue {
    setCurrentList: (listId: string) => void;
    currentList: CurrentList;
}

const ListContext = createContext<ListContextValue | null>(null);

export const ListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentList, setCurrentListState] = useState<CurrentList>({
        id: 'EMPTY',
        numUpdates: 0
    })

    const setCurrentList = (listId: string) => {
        if (currentList.id === listId) {
            setCurrentListState({ ...currentList, numUpdates: currentList.numUpdates + 1 });
        } else {
            setCurrentListState({ id: listId, numUpdates: 0 });
        }
    };

    return (
        <ListContext.Provider
            value={{
                setCurrentList,
                currentList,
            }}>
            {children}
        </ListContext.Provider>
    );
};

export const useListContext = () => {
    const context = useContext(ListContext);
    if (!context) {
        throw new Error("useListContext must be used within a Provider");
    }
    return context;
};
