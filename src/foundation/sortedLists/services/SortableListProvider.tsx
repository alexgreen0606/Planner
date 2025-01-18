import React, { createContext, useContext, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useDerivedValue,
} from 'react-native-reanimated';
import { ListItem } from '../utils';

interface CurrentList {
    id: string;
    numUpdates: number;
}

interface SortableListContextValue<T extends ListItem> {
    scroll: (distance: number) => void;
    currentTextfieldItem: T | undefined;
    setCurrentTextfieldItem: React.Dispatch<React.SetStateAction<T | undefined>>;
    currentList: CurrentList | undefined;
    setCurrentList: (listId: string) => void;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider: React.FC<{ children: React.ReactNode }> = <T extends ListItem>({ children }: { children: React.ReactNode }) => {
    const [currentTextfieldItem, setCurrentTextfieldItem] = useState<T>();
    const [currentList, setCurrentListState] = useState<CurrentList>();
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

    const setCurrentList = (listId: string) => {
        if (currentList?.id === listId) {
            setCurrentListState({ ...currentList, numUpdates: currentList.numUpdates + 1 });
        } else {
            setCurrentListState({ id: listId, numUpdates: 0 });
        }
    };

    return (
        <SortableListContext.Provider value={{
            scroll,
            currentTextfieldItem,
            setCurrentTextfieldItem,
            currentList,
            setCurrentList
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
