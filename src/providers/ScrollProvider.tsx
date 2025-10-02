import { LIST_ITEM_HEIGHT, SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import React, { createContext, useContext } from 'react';
import { RefreshControl, ScrollViewProps } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalDataContext } from './ExternalDataProvider';

// ✅ 

type TScrollProviderProps = ScrollViewProps & {
    scrollOffset: SharedValue<number>;
    shouldReloadPage?: boolean;
    additionalHeaderHeight?: number;
};

type TScrollContext = {
    scrollOffset: SharedValue<number>;
    onAutoScroll: (newOffset: number) => void;
};

const ScrollContext = createContext<TScrollContext | null>(null);

export const ScrollProvider = ({
    scrollOffset,
    shouldReloadPage,
    additionalHeaderHeight = 0,
    ...scrollProps
}: TScrollProviderProps) => {
    const { top: TOP_SPACER } = useSafeAreaInsets();

    const scrollRef = useAnimatedRef<Animated.ScrollView>();

    const isAutoScrolling = useSharedValue(false);

    const { onReloadPage, loading } = useExternalDataContext();

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
                contentInsetAdjustmentBehavior="automatic"
                ref={scrollRef}
                alwaysBounceVertical
                bounces
                refreshControl={shouldReloadPage ? <RefreshControl onRefresh={onReloadPage} refreshing={loading} /> : undefined}
                scrollEventThrottle={SCROLL_THROTTLE}
                onScroll={scrollHandler}
                keyboardShouldPersistTaps='always'
                contentInset={{ top: additionalHeaderHeight }}
                contentOffset={{ y: -additionalHeaderHeight - TOP_SPACER, x: 0 }}
                scrollIndicatorInsets={{ top: additionalHeaderHeight }}
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