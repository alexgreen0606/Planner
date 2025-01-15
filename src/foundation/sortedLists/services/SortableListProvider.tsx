import React, { createContext, useContext } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useDerivedValue,
} from 'react-native-reanimated';

interface SortableListContextValue {
    scroll: (distance: number) => void;
}

const SortableListContext = createContext<SortableListContextValue | null>(null);

export const SortableListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const animatedRef = useAnimatedRef<Animated.ScrollView>();
    const scrollPosition = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollPosition.value = event.contentOffset.y;
        }
    });

    useDerivedValue(() => {
        scrollTo(animatedRef, 0, scrollPosition.value, false);
    });

    const scroll = (distance: number) => {
        'worklet';
        scrollPosition.value -= distance;
    };

    return (
        <SortableListContext.Provider
            value={{ scroll }}>
            <Animated.ScrollView
                ref={animatedRef}
                style={{ width: '100%', height: '100%' }}
                onScroll={scrollHandler}
            >
                {children}
            </Animated.ScrollView>
        </SortableListContext.Provider>
    );
};

export const useSortableListContext = () => {
    const context = useContext(SortableListContext);
    if (!context) {
        throw new Error("useSortableList must be used within a Provider");
    }

    return context;
};
