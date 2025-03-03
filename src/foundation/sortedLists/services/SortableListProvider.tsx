import React, { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useAnimatedReaction,
    SharedValue,
    measure,
} from 'react-native-reanimated';
import { ListItem, SCROLL_THROTTLE } from '../types';
import { ScrollView, View } from 'react-native';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedView = Animated.createAnimatedComponent(View);

interface PendingDelete<T extends ListItem> {
    timeout: NodeJS.Timeout;
    item: T;
}

interface SortableListContextValue<T extends ListItem> {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    scrollOffsetBounds: SharedValue<{ min: number, max: number }>;
    disableNativeScroll: SharedValue<boolean>;
    evaluateOffsetBounds: (customContentHeight: number) => void;
    // --- List Variables ---
    currentTextfield: T | undefined;
    setCurrentTextfield: React.Dispatch<React.SetStateAction<T | undefined>>;
    pendingDeletes: React.MutableRefObject<Map<string, PendingDelete<T>>>;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

/**
 * Provider to allow multiple lists to be rendered within a larger scroll container.
 * 
 * Container allows for native scrolling, or manual scrolling by exposing the @scrollOffset variable.
 * Manual scroll will only work while @isManualScrolling variable is set to true.
 */
export const SortableListProvider = <T extends ListItem>({ children }: PropsWithChildren<{}>) => {
    // --- List Variables ---
    const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    const pendingDeletes = useRef<Map<string, PendingDelete<T>>>(new Map());

    // --- Scroll Variables ---
    const [visibleHeight, setVisibleHeight] = useState(0);
    const scrollOffsetBounds = useSharedValue({
        min: 0,
        max: 0
    });
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const contentRef = useAnimatedRef<Animated.View>();
    const scrollOffset = useSharedValue(0);
    const disableNativeScroll = useSharedValue(false);

    // ------------- Utility Functions -------------

    const evaluateOffsetBounds = (customContentHeight: number = 0) => {
        'worklet';
        const contentHeight = Math.max(customContentHeight, measure(contentRef)?.height ?? 0);
        scrollOffsetBounds.value = {
            min: 0,
            max: Math.max(0, contentHeight - visibleHeight)
        };
    };

    // ---------- Animated Reactions ----------

    // Manual Scroll
    useAnimatedReaction(
        () => scrollOffset.value,
        (current) => {
            scrollTo(scrollRef, 0, current, false);
        }
    );

    // Native Scroll
    const handler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!disableNativeScroll.value)
                scrollOffset.value = event.contentOffset.y;
        }
    });

    return (
        <SortableListContext.Provider
            value={{
                currentTextfield,
                setCurrentTextfield,
                pendingDeletes,
                scrollOffset,
                disableNativeScroll,
                scrollOffsetBounds,
                evaluateOffsetBounds
            }}
        >
            <AnimatedScrollView
                ref={scrollRef}
                scrollEventThrottle={SCROLL_THROTTLE}
                scrollToOverflowEnabled={true}
                onScroll={handler}
                contentContainerStyle={{ flexGrow: 1 }}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setVisibleHeight(height);
                }}
            >
                <AnimatedView ref={contentRef} style={{ flex: 1 }}>
                    {children}
                </AnimatedView>
            </AnimatedScrollView>
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