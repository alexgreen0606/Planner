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
import { useExternalDataContext } from './ExternalDataProvider';

// ✅ 

type TScrollProviderProps = ScrollViewProps & {
    scrollOffset: SharedValue<number>;
    shouldReloadPage?: boolean;
};

type TScrollContext = {
    scrollOffset: SharedValue<number>;
    onAutoScroll: (newOffset: number) => void;
};

const ScrollContext = createContext<TScrollContext | null>(null);

export const ScrollProvider = ({ scrollOffset, shouldReloadPage, ...scrollProps }: TScrollProviderProps) => {
    const scrollRef = useAnimatedRef<Animated.ScrollView>();

    const disableNativeScroll = useSharedValue(false);

    const { onReloadPage } = useExternalDataContext();

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!disableNativeScroll.value) {
                scrollOffset.value = event.contentOffset.y;
            }
        }
    });

    // Scroll the container during auto-scroll.
    useAnimatedReaction(
        () => ({ scroll: scrollOffset.value, active: disableNativeScroll.value }),
        ({ scroll, active }) => {
            if (active) {
                scrollTo(scrollRef, 0, scroll, false);
            }
        }
    );

    function handleAutoScroll(displacement: number) {
        'worklet';
        const SECONDS_PER_ITEM = .25;

        const newOffset = scrollOffset.value + displacement;
        const durationMs = Math.abs(
            (displacement / LIST_ITEM_HEIGHT) * SECONDS_PER_ITEM * 1000
        );
        disableNativeScroll.value = true;
        scrollOffset.value = withTiming(
            newOffset,
            { duration: durationMs, easing: Easing.linear },
            () => {
                disableNativeScroll.value = false;
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
                refreshControl={shouldReloadPage ? <RefreshControl size={20} onRefresh={onReloadPage} refreshing={true} /> : undefined}
                scrollEventThrottle={SCROLL_THROTTLE}
                onScroll={scrollHandler}
                keyboardShouldPersistTaps='always'
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