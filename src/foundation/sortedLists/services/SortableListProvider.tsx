import React, { createContext, useContext, useRef, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useAnimatedKeyboard,
    useAnimatedReaction,
    SharedValue,
    measure,
    useAnimatedStyle,
    interpolate,
    runOnJS,
    Extrapolation,
    cancelAnimation,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { ListItem, SCROLL_THROTTLE } from '../types';
import { ScrollView, View, KeyboardAvoidingView } from 'react-native';
import GenericIcon from '../../components/GenericIcon';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BANNER_HEIGHT } from '../../components/constants';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedReload = Animated.createAnimatedComponent(View);

interface PendingDelete<T extends ListItem> {
    timeout: NodeJS.Timeout;
    item: T;
}

interface SortableListProviderProps<T extends ListItem> {
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
    setCurrentTextfield: React.Dispatch<React.SetStateAction<T | undefined>>;
    previousTextfieldId: T | undefined;
    setPreviousTextfieldId: React.Dispatch<React.SetStateAction<string | undefined>>;
    pendingDeletes: React.MutableRefObject<Map<string, PendingDelete<T>>>;
    loadingData: boolean;
    keyboardPosition: SharedValue<number>;
    endLoadingData: () => void;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

/**
 * Provider to allow multiple lists to be rendered within a larger scroll container.
 * 
 * Container allows for native scrolling, or manual scrolling by exposing the @scrollOffset variable.
 * Manual scroll will only work while @isManualScrolling variable is set to true.
 */
export const SortableListProvider = <T extends ListItem>({
    children,
    enableReload = false,
}: SortableListProviderProps<T>) => {
    const { top } = useSafeAreaInsets();
    const keyboard = useAnimatedKeyboard();

    // --- List Variables ---
    const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    const [previousTextfieldId, setPreviousTextfieldId] = useState<string | undefined>(undefined);
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

    // --- Reload Variables ---
    const [loadingData, setLoadingData] = useState(false);
    const [showCheckmark, setShowCheckmark] = useState(false);
    const canRefresh = useSharedValue(true);
    const spinValue = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const loadingComplete = useSharedValue(false);

    // ------------- Utility Functions -------------

    const triggerHaptic = () => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    };

    const endLoadingData = () => {
        setLoadingData(false);
    }

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
            if (enableReload) {
                offsetY.value = Math.min(0, current);

                // Allow refreshes when scroll returns to top
                if (current >= 0 && !canRefresh.value) {
                    canRefresh.value = true;
                    loadingComplete.value = false;
                    runOnJS(setShowCheckmark)(false);
                }

                if (canRefresh.value && current <= -100) {
                    canRefresh.value = false;
                    runOnJS(setLoadingData)(true);
                }
            }
        }
    );

    // Loading Spin Animation
    useAnimatedReaction(
        () => loadingData,
        (isLoading, wasLoading) => {
            if (isLoading && !wasLoading) {
                // Begin Spinning Animation
                runOnJS(triggerHaptic)();
                canRefresh.value = false;
                spinValue.value = withRepeat(
                    withTiming(spinValue.value - 360, {
                        duration: 500,
                        easing: Easing.linear
                    }),
                    -1,
                    false,
                );
            } else if (!isLoading && wasLoading) {
                loadingComplete.value = true;
                runOnJS(setShowCheckmark)(true);
            }
        }, [loadingData])

    // Native Scroll
    const handler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!disableNativeScroll.value) {
                scrollOffset.value = event.contentOffset.y;
            }
        }
    });

    // Spin Icon End
    useAnimatedReaction(
        () => ({ complete: loadingComplete.value, rotation: spinValue.value }),
        (curr) => {
            if (curr.complete && curr.rotation % 360 >= -1) {
                cancelAnimation(spinValue);
            }
        }
    );

    const refreshIconStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            offsetY.value,
            [-50, -100],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [
                { rotate: `${spinValue.value}deg` },
            ],
            position: 'absolute',
            top: -50,
            alignSelf: 'center',
        };
    });

    return (
        <SortableListContext.Provider
            value={{
                currentTextfield,
                keyboardPosition: keyboard.height,
                setCurrentTextfield,
                pendingDeletes,
                scrollOffset,
                disableNativeScroll,
                scrollOffsetBounds,
                evaluateOffsetBounds,
                loadingData,
                endLoadingData,
                previousTextfieldId,
                setPreviousTextfieldId
            }}
        >
            <KeyboardAvoidingView
                behavior='padding' // TODO which to use
                keyboardVerticalOffset={top + BANNER_HEIGHT}
                style={{ flex: 1 }}
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
                        {enableReload && (
                            <AnimatedReload style={[refreshIconStyle]}>
                                <GenericIcon
                                    size='l'
                                    platformColor={showCheckmark ? 'systemTeal' : 'secondaryLabel'}
                                    type={showCheckmark ? 'refreshComplete' : 'refresh'}
                                />
                            </AnimatedReload>
                        )}
                        {children}
                    </AnimatedView>
                </AnimatedScrollView>
            </KeyboardAvoidingView>
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