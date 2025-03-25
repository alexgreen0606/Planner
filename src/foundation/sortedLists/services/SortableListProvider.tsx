import React, { createContext, useContext, useEffect, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useAnimatedReaction,
    SharedValue,
    measure,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { ListItem } from '../types';
import { ScrollView, View } from 'react-native';
import { KeyboardProvider, useKeyboard } from './KeyboardProvider';
import { SCROLL_THROTTLE } from '../constants';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedFiller = Animated.createAnimatedComponent(View);

interface TextFieldState<T> {
    current: T | undefined;
    pending?: T | undefined;
}

interface SortableListProviderProps {
    children: React.ReactNode;
    enableReload?: boolean;
}

interface SortableListContextValue<T extends ListItem> {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    scrollOffsetBounds: SharedValue<{ min: number, max: number }>;
    disableNativeScroll: SharedValue<boolean>;
    evaluateOffsetBounds: (customContentHeight: number) => void;
    // --- List Variables ---
    currentTextfield: T | undefined;
    setCurrentTextfield: (current: T | undefined, pending?: T | undefined) => void;
    pendingItem: T | undefined;
    pendingDeleteItems: T[];
    setPendingDeleteItems: React.Dispatch<React.SetStateAction<T[]>>;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider = ({
    children,
}: SortableListProviderProps) => {
    return (
        <KeyboardProvider>
            <SortableListProviderContent>
                {children}
            </SortableListProviderContent>
        </KeyboardProvider>
    );
};

/**
 * Provider to allow multiple lists to be rendered within a larger scroll container.
 * 
 * Container allows for native scrolling, or manual scrolling by exposing the @scrollOffset variable.
 * Manual scroll will only work while @isManualScrolling variable is set to true.
 */
export const SortableListProviderContent = <T extends ListItem>({
    children
}: SortableListProviderProps) => {

    // --- List Variables ---
    // Replace separate states with combined state
    const [textFieldState, setTextFieldState] = useState<TextFieldState<T>>({
        current: undefined,
        pending: undefined
    });
    // const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    // const [previousTextfieldId, setPreviousTextfieldId] = useState<string | undefined>(undefined);
    const [pendingDeleteItems, setPendingDeleteItems] = useState<T[]>([]);

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
    const { keyboardHeight } = useKeyboard();

    // ------------- Utility Functions -------------

    const setCurrentTextfield = (current: T | undefined, pending?: T | undefined) => {
        setTextFieldState({
            current,
            pending
        });
    };

    const evaluateOffsetBounds = (customContentHeight: number = 0) => {
        'worklet';
        const contentHeight = Math.max(customContentHeight, measure(contentRef)?.height ?? 0);
        scrollOffsetBounds.value = {
            min: 0,
            max: Math.max(0, contentHeight - visibleHeight)
        };
    };

    // ---------- Animated Reactions ----------

    // Native Scroll
    const handler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!disableNativeScroll.value) {
                scrollOffset.value = event.contentOffset.y;
            }
        }
    });

    // Manual Scroll
    useAnimatedReaction(
        () => scrollOffset.value,
        (current) => scrollTo(scrollRef, 0, current, false)
    );

    const keyboardPadboxStyle = useAnimatedStyle(() => {
        return {
            width: 100,
            height: keyboardHeight.value
        };
    });

    return (
        <SortableListContext.Provider
            value={{
                currentTextfield: textFieldState.current,
                setCurrentTextfield,
                scrollOffset,
                disableNativeScroll,
                scrollOffsetBounds,
                evaluateOffsetBounds,
                pendingItem: textFieldState.pending,
                pendingDeleteItems,
                setPendingDeleteItems
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
                    <AnimatedFiller style={keyboardPadboxStyle} />
                </AnimatedView>
            </AnimatedScrollView>
        </SortableListContext.Provider>
    );
};

export const useSortableList = () => {
    const context = useContext(SortableListContext);
    if (!context) {
        throw new Error("useSortableList must be used within a Provider");
    }
    return context;
};