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
    runOnJS,
    Extrapolation,
    cancelAnimation,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { ListItem } from '../types';
import { ScrollView, View } from 'react-native';
import GenericIcon from '../../components/GenericIcon';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { KeyboardProvider, useKeyboard } from './KeyboardProvider';
import { SCROLL_THROTTLE } from '../constants';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedReload = Animated.createAnimatedComponent(View);
const AnimatedFiller = Animated.createAnimatedComponent(View);

interface SortableListProviderProps {
    children: React.ReactNode;
    enableReload?: boolean;
}

enum LoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
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
    pendingDeleteItems: T[];
    setPendingDeleteItems: React.Dispatch<React.SetStateAction<T[]>>;
    loadingData: boolean;
    endLoadingData: () => void;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider = ({
    children,
    enableReload = false,
}: SortableListProviderProps) => {
    return (
        <KeyboardProvider>
            <SortableListProviderContent enableReload={enableReload}>
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
    enableReload = false,
}: SortableListProviderProps) => {

    // --- List Variables ---
    const [currentTextfield, setCurrentTextfield] = useState<T | undefined>(undefined);
    const [previousTextfieldId, setPreviousTextfieldId] = useState<string | undefined>(undefined);
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

    // --- Reload Variables ---
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.STATIC);
    const loadingAnimationTrigger = useSharedValue<LoadingStatus>(LoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

    // ------------- Utility Functions -------------

    const triggerHaptic = () => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    };

    const updateLoadingStatus = (newStatus: LoadingStatus) => {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
    }

    const endLoadingData = () => {
        if (loadingStatus !== LoadingStatus.STATIC) {
            updateLoadingStatus(LoadingStatus.COMPLETE);
        }
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
        (current) => {
            scrollTo(scrollRef, 0, current, false);
            if (enableReload) {
                // scrollOverbound.value = Math.min(0, current);

                // Allow refreshes when scroll returns to top
                if (current >= 0 && loadingAnimationTrigger.value === LoadingStatus.COMPLETE) {
                    runOnJS(updateLoadingStatus)(LoadingStatus.STATIC);
                }

                // Trigger a reload of the list
                if (loadingAnimationTrigger.value === LoadingStatus.STATIC && current <= -100) {
                    runOnJS(updateLoadingStatus)(LoadingStatus.LOADING);
                }
            }
        }
    );

    // Loading Spinner Animation
    useAnimatedReaction(
        () => ({
            status: loadingAnimationTrigger.value,
            overscroll: Math.min(0, scrollOffset.value),
            rotation: loadingRotation.value
        }),
        (curr, prev) => {
            if (curr.status === LoadingStatus.STATIC) return;
            if (curr.status === LoadingStatus.LOADING && prev?.status !== LoadingStatus.LOADING) {
                // Begin Spinning Animation
                runOnJS(triggerHaptic)();
                loadingRotation.value = withRepeat(
                    withTiming(loadingRotation.value - 360, {
                        duration: 500,
                        easing: Easing.linear
                    }),
                    -1,
                    false,
                );
            } else if (curr.status === LoadingStatus.COMPLETE) {
                if (curr.rotation % 360 >= -1) {
                    cancelAnimation(loadingRotation);
                }
            }
        }
    );

    const loadingIconStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            Math.min(0, scrollOffset.value),
            [-50, -100],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [
                { rotate: `${loadingRotation.value}deg` },
            ],
            position: 'absolute',
            top: -50,
            alignSelf: 'center',
        };
    });

    const keyboardPadboxStyle = useAnimatedStyle(() => {
        return {
            width: 100,
            height: keyboardHeight.value
        };
    });

    return (
        <SortableListContext.Provider
            value={{
                currentTextfield,
                setCurrentTextfield,
                scrollOffset,
                disableNativeScroll,
                scrollOffsetBounds,
                evaluateOffsetBounds,
                loadingData: loadingStatus === LoadingStatus.LOADING,
                endLoadingData,
                previousTextfieldId,
                setPreviousTextfieldId,
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
                    {enableReload && (
                        <AnimatedReload style={[loadingIconStyle]}>
                            <GenericIcon
                                size='l'
                                platformColor={loadingStatus === LoadingStatus.COMPLETE ? 'systemTeal' : 'secondaryLabel'}
                                type={loadingStatus === LoadingStatus.COMPLETE ? 'refreshComplete' : 'refresh'}
                            />
                        </AnimatedReload>
                    )}
                    {children}
                    <AnimatedFiller style={keyboardPadboxStyle} />
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