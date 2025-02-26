import React, { createContext, PropsWithChildren, useContext, useRef, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useAnimatedReaction,
    withTiming,
    SharedValue,
    withSpring,
    withDecay,
} from 'react-native-reanimated';
import { ListItem, SCROLL_THROTTLE } from '../types';
import { ScrollView } from 'react-native';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Types and Interfaces
interface PendingDelete<T extends ListItem> {
    timeout: NodeJS.Timeout;
    item: T;
}

interface SortableListContextValue<T extends ListItem> {
    scroll: (distance: number) => void;
    endScroll: (velocity?: number) => void;
    currentTextfield: T | undefined;
    setCurrentTextfield: React.Dispatch<React.SetStateAction<T | undefined>>;
    pendingDeletes: React.MutableRefObject<Map<string, PendingDelete<T>>>;
    scrollPosition: SharedValue<number>;
    unboundedScrollPosition: SharedValue<number>;
    isManualScrolling: SharedValue<boolean>;
    sanitizeScrollPosition: (newPosition: number) => number;
}

// Constants
const RESISTANCE = 0.4;

// Context Creation
const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider = <T extends ListItem>({ children }: PropsWithChildren<{}>) => {
    // State Management
    const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    const [contentHeight, setContentHeight] = useState(0);
    const [visibleHeight, setVisibleHeight] = useState(0);

    // Refs and Animated Values
    const animatedRef = useAnimatedRef<Animated.ScrollView>();
    const pendingDeletes = useRef<Map<string, PendingDelete<T>>>(new Map());
    const scrollPosition = useSharedValue(0);
    const unboundedScrollPosition = useSharedValue(0);
    const isManualScrolling = useSharedValue(false);

    // ------------- Utility Functions -------------

    const getScrollBoundaries = () => {
        'worklet';
        const minBound = 0;
        const maxBound = Math.max(0, contentHeight - visibleHeight);
        return { minBound, maxBound: 2000 };
    };

    const isOutOfBounds = () => {
        'worklet';
        const { minBound, maxBound } = getScrollBoundaries();
        return scrollPosition.value < minBound || scrollPosition.value > maxBound;
    };

    const sanitizeScrollPosition = (newPosition: number = scrollPosition.value) => {
        'worklet';
        const { minBound, maxBound } = getScrollBoundaries();
        return Math.max(minBound, Math.min(newPosition, maxBound));
    };

    /**
     * Handles scrolling with elastic resistance.
     * @param distance Scroll distance (negative for down, positive for up)
     */
    const scroll = (distance: number) => {
        'worklet';
        isManualScrolling.value = true;

        const { minBound, maxBound } = getScrollBoundaries();
        unboundedScrollPosition.value -= distance;

        let displayPosition;
        if (unboundedScrollPosition.value < minBound) {
            const overscroll = minBound - unboundedScrollPosition.value;
            displayPosition = minBound - (overscroll * RESISTANCE);
        } else if (unboundedScrollPosition.value > maxBound) {
            const overscroll = unboundedScrollPosition.value - maxBound;
            displayPosition = maxBound + (overscroll * RESISTANCE);
        } else {
            displayPosition = unboundedScrollPosition.value;
        }

        scrollPosition.value = withTiming(displayPosition, { duration: 16 });
    };

    /**
     * Executes a scroll rebound if user scrolled past container bounds,
     * or continues scrolling with momentum if within bounds.
     * @param velocity The velocity at which the user was scrolling
     */
    const endScroll = (velocity: number = 0) => {
        'worklet';

        // If out of bounds, rebound to valid position
        if (isOutOfBounds()) {
            const validPosition = sanitizeScrollPosition();

            scrollPosition.value = withSpring(
                validPosition,
                {
                    stiffness: 100, // Lower stiffness will make it slower
                    damping: 40,   // Higher damping will make the movement more controlled
                    mass: .6,       // Standard mass, can be adjusted if needed
                    overshootClamping: true
                },
                () => {
                    unboundedScrollPosition.value = scrollPosition.value;
                    isManualScrolling.value = false;
                }
            );
        } else {
            scrollPosition.value = withDecay(
                {
                    velocity: -velocity,
                    rubberBandEffect: true,
                    clamp: [0, 1000],
                    rubberBandFactor: RESISTANCE
                },
                () => {
                    unboundedScrollPosition.value = scrollPosition.value;
                    isManualScrolling.value = false;
                }
            );
        }
    };

    // ---------- Animated Reactions ----------

    // Manual Scroll
    useAnimatedReaction(
        () => scrollPosition.value,
        (current) => {
            scrollTo(animatedRef, 0, current, false);
        }
    );

    // Native Scroll
    const handler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!isManualScrolling.value)
                scrollPosition.value = event.contentOffset.y;
        }
    })

    return (
        <SortableListContext.Provider
            value={{
                scroll,
                sanitizeScrollPosition,
                endScroll,
                currentTextfield,
                setCurrentTextfield,
                pendingDeletes,
                scrollPosition,
                isManualScrolling,
                unboundedScrollPosition
            }}
        >
            <AnimatedScrollView
                ref={animatedRef}
                scrollEventThrottle={SCROLL_THROTTLE}
                scrollToOverflowEnabled={true}
                onScroll={handler}
                contentContainerStyle={{ flexGrow: 1 }}
                onContentSizeChange={(width, height) => setContentHeight(height)}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setVisibleHeight(height);
                }}
            >
                {children}
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