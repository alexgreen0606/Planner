import React, { createContext, useContext, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useAnimatedReaction,
    SharedValue,
    measure,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { ListItem } from '../types';
import { PlatformColor, ScrollView, useWindowDimensions, View } from 'react-native';
import { KeyboardProvider, useKeyboard } from './KeyboardProvider';
import { SCROLL_THROTTLE } from '../constants';
import { ReloadProvider } from './ReloadProvider';
import { BANNER_HEIGHT } from '../../components/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedFiller = Animated.createAnimatedComponent(View);
const AnimatedBanner = Animated.createAnimatedComponent(View);

interface TextFieldState<T> {
    current: T | undefined;
    pending?: T | undefined;
}

interface SortableListProviderProps {
    children: React.ReactNode;
    bannerContent: React.ReactNode;
}

interface SortableListContextValue<T extends ListItem> {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    scrollOffsetBounds: SharedValue<{ min: number, max: number }>;
    disableNativeScroll: SharedValue<boolean>;
    evaluateOffsetBounds: (customContentHeight: number) => void;
    // --- List Variables ---
    currentTextfield: T | undefined;
    pendingItem: T | undefined;
    setCurrentTextfield: (current: T | undefined, pending?: T | undefined) => void;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider = ({
    children,
    bannerContent
}: SortableListProviderProps) => {
    return (
        <KeyboardProvider>
            <SortableListProviderContent bannerContent={bannerContent}>
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
    children,
    bannerContent
}: SortableListProviderProps) => {
    const { top } = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // --- List Variables ---
    const [textFieldState, setTextFieldState] = useState<TextFieldState<T>>({
        current: undefined,
        pending: undefined
    });

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

    const bannerStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollOffset.value,
                [0, BANNER_HEIGHT * 2],
                [1, 0],
                Extrapolation.CLAMP
            ),
            height: BANNER_HEIGHT + top,
            width,
            position: 'absolute',
            top: 0,
            zIndex: 2,
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
            }}
        >
            <AnimatedScrollView
                ref={scrollRef}
                scrollEventThrottle={SCROLL_THROTTLE}
                scrollToOverflowEnabled={true}
                onScroll={handler}
                contentContainerStyle={{ flexGrow: 1, paddingTop: BANNER_HEIGHT + top }}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setVisibleHeight(height);
                }}
            >
                <AnimatedView ref={contentRef} style={{ flex: 1 }}>
                    <ReloadProvider>
                        {children}
                    </ReloadProvider>
                    <AnimatedFiller style={keyboardPadboxStyle} />
                </AnimatedView>
            </AnimatedScrollView>
            <BlurView
                tint='default'
                intensity={40}
                style={{
                    height: BANNER_HEIGHT + top,
                    width,
                    position: 'absolute',
                    top: 0,
                    zIndex: 1
                }}
            />
            <AnimatedBanner style={bannerStyle}>
                <View style={{
                    flex: 1,
                    backgroundColor: PlatformColor('systemBackground')
                }} />
            </AnimatedBanner>
            <View style={{ position: 'absolute', top, zIndex: 3 }}>
                {bannerContent}
            </View>
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