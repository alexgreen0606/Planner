import React, { createContext, useContext, useRef, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useDerivedValue,
    SharedValue,
} from 'react-native-reanimated';
import { ListItem } from '../utils';

interface CurrentListInfo {
    id: string;
    numUpdates: number;
}

interface SortableListContextValue<T extends ListItem> {
    scroll: (distance: number) => void;
    currentTextfield: T | undefined;
    setCurrentTextfield: React.Dispatch<React.SetStateAction<T | undefined>>;
    // currentListInfo: SharedValue<CurrentListInfo | undefined>;
    // setCurrentListInfo: (listId: string) => void;
    pendingDeletes: React.MutableRefObject<Map<string, NodeJS.Timeout>>;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider: React.FC<{ children: React.ReactNode }> = <T extends ListItem>({ children }: { children: React.ReactNode }) => {
    const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    // const currentListInfo = useSharedValue<CurrentListInfo | undefined>(undefined);
    const animatedRef = useAnimatedRef<Animated.ScrollView>();
    const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());
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

    // const setCurrentListInfo = (listId: string) => {
    //     if (currentListInfo.value?.id === listId) {
    //         currentListInfo.value = { ...currentListInfo.value, numUpdates: currentListInfo.value.numUpdates + 1 };
    //     } else {
    //         currentListInfo.value = { id: listId, numUpdates: 0 };
    //     }
    // };

    return (
        <SortableListContext.Provider value={{
            scroll,
            currentTextfield,
            setCurrentTextfield,
            // currentListInfo,
            // setCurrentListInfo,
            pendingDeletes,
        }}>
            <Animated.ScrollView
                ref={animatedRef}
                style={{ flex: 1 }}
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
