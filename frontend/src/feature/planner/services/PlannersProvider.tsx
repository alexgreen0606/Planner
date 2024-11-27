import React, { createContext, useContext, useState } from 'react';

interface ApiError {
    message: string;
}

interface ApiContextValue {
    increment: () => void;
    decrement: () => void;
    isLoading: boolean;
    addError: (error: ApiError) => void;
    clearErrors: () => void;
    errors: ApiError[];
    setCurrentList: (listId: string) => void;
    currentList: string;
}

const PlannersContext = createContext<ApiContextValue | null>(null);

export const PlannersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loadingCount, setLoadingCount] = useState(0);
    const [errors, setErrors] = useState<ApiError[]>([]);
    const [currentList, setCurrentList] = useState<string>('')

    const increment = () => setLoadingCount((count) => count + 1);
    const decrement = () => setLoadingCount((count) => Math.max(0, count - 1));
    const isLoading = loadingCount > 0;

    const addError = (error: ApiError) => {
        setErrors(prevErrors => [...prevErrors, error]);
    };

    const clearErrors = () => setErrors([]);

    return (
        <PlannersContext.Provider
            value={{
                increment,
                setCurrentList,
                currentList,
                decrement,
                clearErrors,
                isLoading,
                addError,
                errors
            }}>
            {children}
        </PlannersContext.Provider>
    );
};

export const usePlannersContext = () => {
    const context = useContext(PlannersContext);
    if (!context) {
        throw new Error("usePlannersContext must be used within an ApiProvider");
    }
    return context;
};
