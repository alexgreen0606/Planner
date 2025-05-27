import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { TIME_MODAL_PATHNAME } from 'app/(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useRef } from 'react';

interface TimeModalContextType {
    onOpen: (
        initialEvent: IPlannerEvent,
        onSave: (newEvent: IPlannerEvent) => Promise<void>
    ) => void;
    onClose: () => void;
    onSave: (updatedPlanEvent: IPlannerEvent) => void;
    initialEvent: React.MutableRefObject<IPlannerEvent | null>;
}

interface TimeModalProviderProps {
    children: React.ReactNode;
}

const TimeModalContext = createContext<TimeModalContextType | null>(null);

export const TimeModalProvider: React.FC<TimeModalProviderProps> = ({ children }) => {
    const router = useRouter();
    const initialEvent = useRef<IPlannerEvent | null>(null);
    const saveFunc = useRef<((event: IPlannerEvent) => void) | null>(null);

    function onOpen(event: IPlannerEvent, save: (event: IPlannerEvent) => void) {
        initialEvent.current = event;
        saveFunc.current = save;
        router.push(TIME_MODAL_PATHNAME);
    };

    function onClose() {
        initialEvent.current = null;
        saveFunc.current = null;
        router.back();
    };

    function onSave(updatedEvent: IPlannerEvent) {
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