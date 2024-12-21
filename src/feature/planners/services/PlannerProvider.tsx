import React, { createContext, useContext, useState } from 'react';

interface CurrentPlanner {
    timestamp: string | null;
    numUpdates: number;
}

interface PlannerContextValue {
    setFocusedPlanner: (timestamp: string) => void;
    focusedPlanner: CurrentPlanner;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [focusedPlanner, setFocusedPlannerState] = useState<CurrentPlanner>({
        timestamp: null,
        numUpdates: 0
    })

    const setFocusedPlanner = (timestamp: string) => {
        if (focusedPlanner.timestamp === timestamp) {
            setFocusedPlannerState({ ...focusedPlanner, numUpdates: focusedPlanner.numUpdates + 1 });
        } else {
            setFocusedPlannerState({ timestamp, numUpdates: 0 });
        }
    };

    return (
        <PlannerContext.Provider
            value={{
                setFocusedPlanner,
                focusedPlanner,
            }}>
            {children}
        </PlannerContext.Provider>
    );
};

export const usePlannerContext = () => {
    const context = useContext(PlannerContext);
    if (!context) {
        throw new Error("usePlannerContext must be used within a Provider");
    }
    return context;
};
