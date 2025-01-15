import React, { createContext, useContext, useRef } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useDerivedValue,
} from 'react-native-reanimated';

interface DraggableContextValue {
    scroll: (distance: number) => void;
    beginClickingItem: () => void;
    endClickingItem: () => void;
}

const DraggableListContext = createContext<DraggableContextValue | null>(null);

export const DraggableListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const manualScrollMode = useSharedValue(false);
    const animatedRef = useAnimatedRef<Animated.ScrollView>();
    const scrollPosition = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!manualScrollMode.value)
                scrollPosition.value = event.contentOffset.y;
        }
    });

    useDerivedValue(() => {
        scrollTo(animatedRef, 0, scrollPosition.value, false);
    });

    const scroll = (distance: number) => {
        scrollPosition.value -= distance;
    };

    const beginClickingItem = () => {
        manualScrollMode.value = true;
    };

    const endClickingItem = () => {
        manualScrollMode.value = false;
    };


    return (
        <DraggableListContext.Provider
            value={{
                beginClickingItem,
                endClickingItem,
                scroll
            }}>
            <Animated.ScrollView
                ref={animatedRef}
                style={{ width: '100%', height: '100%' }}
                onScroll={scrollHandler}
            >
                {children}
            </Animated.ScrollView>
        </DraggableListContext.Provider>
    );
};

export const useDraggableListContext = () => {
    const context = useContext(DraggableListContext);
    if (!context) {
        throw new Error("useDraggableList must be used within a Provider");
    }

    return context;
};
