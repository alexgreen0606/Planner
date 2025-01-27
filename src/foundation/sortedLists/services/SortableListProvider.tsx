import React, { createContext, PropsWithChildren, useContext, useRef, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useDerivedValue,
    DerivedValue,
} from 'react-native-reanimated';
import { ListItem } from '../utils';

interface PendingDelete<T extends ListItem> {
    timeout: NodeJS.Timeout;
    item: T;
}

interface SortableListContextValue<T extends ListItem> {
    scroll: (distance: number) => void;
    currentTextfield: T | undefined;
    setCurrentTextfield: React.Dispatch<React.SetStateAction<T | undefined>>;
    pendingDeletes: React.MutableRefObject<Map<string, PendingDelete<T>>>;
    scrollPosition: DerivedValue<number>;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider = <T extends ListItem>({ children }: PropsWithChildren<{}>) => {
    const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    const animatedRef = useAnimatedRef<Animated.ScrollView>();
    const pendingDeletes = useRef<Map<string, PendingDelete<T>>>(new Map());
    const scrollPosition = useSharedValue(0);

    const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
    const [layoutMeasurement, setLayoutMeasurement] = useState({ width: 0, height: 0 });


    const scrollPositionConstant = useDerivedValue(() => {
        return scrollPosition.value;
    });

    function getBoundedScrollPosition (newPosition: number) {
        'worklet';
        const boundedBottom = contentSize.height - layoutMeasurement.height;
        return Math.max(
            0,
            Math.min(newPosition, boundedBottom)
        );
    }

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const { contentOffset } = event;

            // Ensure scroll position is within [0, boundedBottom]
            scrollPosition.value = getBoundedScrollPosition(contentOffset.y);
        },
    });

    useDerivedValue(() => {
        scrollTo(animatedRef, 0, scrollPosition.value, false);
    })

    /**
     * Execute a manual scroll on the container of the lists.
     * @param distance - the distance to scroll the container
     */
    function scroll (distance: number) {
        scrollPosition.value = getBoundedScrollPosition(scrollPosition.value - distance);
    };


    return (
        <SortableListContext.Provider value={{
            scroll,
            currentTextfield,
            setCurrentTextfield,
            pendingDeletes,
            scrollPosition: scrollPositionConstant
        }}>
            <Animated.ScrollView
                ref={animatedRef}
                style={{ flex: 1 }}
                scrollEventThrottle={16}
                onScroll={scrollHandler}
                bounces={false}
                contentContainerStyle={{ flexGrow: 1 }}
                onContentSizeChange={(width, height) => setContentSize({ width, height })}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setLayoutMeasurement({ width, height });
                }}
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
