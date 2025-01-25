import React, { createContext, useContext, useRef, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useDerivedValue,
} from 'react-native-reanimated';
import { ListItem } from '../utils';
import globalStyles from '../../theme/globalStyles';

interface PendingDelete<T extends ListItem> {
    timeout: NodeJS.Timeout;
    item: T;
}

interface SortableListContextValue<T extends ListItem> {
    scroll: (distance: number) => void;
    currentTextfield: T | undefined;
    setCurrentTextfield: React.Dispatch<React.SetStateAction<T | undefined>>;
    pendingDeletes: React.MutableRefObject<Map<string, PendingDelete<T>>>;
    scrollPosition: number;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider: React.FC<{ children: React.ReactNode }> = <T extends ListItem>({ children }: { children: React.ReactNode }) => {
    const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    const animatedRef = useAnimatedRef<Animated.ScrollView>();
    const pendingDeletes = useRef<Map<string, PendingDelete<T>>>(new Map());
    const scrollPosition = useSharedValue(0);

    const scrollPositionConstant = useDerivedValue(() => {
        return scrollPosition.value + 100;
    });

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
        <SortableListContext.Provider value={{
            scroll,
            currentTextfield,
            setCurrentTextfield,
            pendingDeletes,
            scrollPosition: scrollPositionConstant.value
        }}>
            <Animated.ScrollView
                ref={animatedRef}
                style={{flex: 1}}
                onScroll={scrollHandler}
                contentContainerStyle={globalStyles.blackFilledSpace}
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
