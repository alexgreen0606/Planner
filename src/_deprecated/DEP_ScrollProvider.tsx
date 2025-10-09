import { LIST_ITEM_HEIGHT, SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import React, { createContext, useContext } from 'react';
import { ScrollViewProps } from 'react-native';
import Animated, {
    Easing,
    scrollTo,
    SharedValue,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

// ✅ 

type TScrollProviderProps = ScrollViewProps & {
    scrollOffset: SharedValue<number>;
};

type TScrollContext = {
    scrollOffset: SharedValue<number>;
    onAutoScroll: (newOffset: number) => void;
};

const ScrollContext = createContext<TScrollContext | null>(null);

export const ScrollProvider = ({
    scrollOffset,
    ...scrollProps
}: TScrollProviderProps) => {
    const scrollRef = useAnimatedRef<Animated.ScrollView>();

    const isAutoScrolling = useSharedValue(false);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (isAutoScrolling.value) return;
            scrollOffset.value = event.contentOffset.y;
        }
    });

    // Scroll the container during auto-scroll.
    useAnimatedReaction(
        () => ({ offset: scrollOffset.value, autoScrolling: isAutoScrolling.value }),
        ({ offset, autoScrolling }) => {
            if (!autoScrolling) return;
            scrollTo(scrollRef, 0, offset, false);
        }
    );

    function handleAutoScroll(displacement: number) {
        'worklet';
        const SECONDS_PER_ITEM = .25;

        const newOffset = scrollOffset.value + displacement;
        const durationMs = Math.abs(
            (displacement / LIST_ITEM_HEIGHT) * SECONDS_PER_ITEM * 1000
        );
        isAutoScrolling.value = true;
        scrollOffset.value = withTiming(
            newOffset,
            { duration: durationMs, easing: Easing.linear },
            () => {
                isAutoScrolling.value = false;
            }
        )
    }

    return (
        <ScrollContext.Provider value={{
            scrollOffset,
            onAutoScroll: handleAutoScroll
        }}>
            <Animated.ScrollView
                onScroll={scrollHandler}
                ref={scrollRef}
                scrollEventThrottle={SCROLL_THROTTLE}
                keyboardShouldPersistTaps='always'
                alwaysBounceVertical
                bounces
                {...scrollProps}
            />
        </ScrollContext.Provider>
    )
};

export const useScrollContext = () => {
    const context = useContext(ScrollContext);
    if (!context) {
        throw new Error("useScrollContext must be used within a ScrollProvider");
    }
    return context;
};