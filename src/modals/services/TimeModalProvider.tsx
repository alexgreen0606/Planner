import React, { createContext, useContext, useRef } from 'react';
import { PlannerEvent } from '../../utils/calendarUtils/types';
import { useRouter } from 'expo-router';
import { TIME_MODAL_PATHNAME } from '../../../app/(modals)/TimeModal';

interface TimeModalContextType {
    onOpen: (
        initialEvent: PlannerEvent,
        onSave: (newEvent: PlannerEvent) => Promise<void>
    ) => void;
    onClose: () => void;
    onSave: (updatedPlanEvent: PlannerEvent) => void;
    initialEvent: React.MutableRefObject<PlannerEvent | null>;
}

interface TimeModalProviderProps {
    children: React.ReactNode;
}

const TimeModalContext = createContext<TimeModalContextType | null>(null);

export const TimeModalProvider: React.FC<TimeModalProviderProps> = ({ children }) => {
    const router = useRouter();
    const initialEvent = useRef<PlannerEvent | null>(null);
    const saveFunc = useRef<((event: PlannerEvent) => void) | null>(null);

    function onOpen(event: PlannerEvent, save: (event: PlannerEvent) => void) {
        initialEvent.current = event;
        saveFunc.current = save;
        router.push(TIME_MODAL_PATHNAME);
    };

    function onClose() {
        initialEvent.current = null;
        saveFunc.current = null;
        router.back();
    };

    function onSave(updatedEvent: PlannerEvent) {
        saveFunc.current?.(updatedEvent);
        onClose();
    };

    return (
        <TimeModalContext.Provider value={{
            onClose,
            onSave,
            onOpen,
            initialEvent
        }}>
            {children}
        </TimeModalContext.Provider>
    );
};

export const useTimeModal = () => {
    const context = useContext(TimeModalContext);
    if (!context) {
        throw new Error("useTimeModal must be used within a ReloadProvider");
    }
    return context;
};