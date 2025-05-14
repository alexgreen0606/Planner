import GenericIcon from '@/components/GenericIcon';
import { BlurView } from 'expo-blur';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Dimensions, PlatformColor, ScrollView, StyleSheet, View } from 'react-native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { Portal } from 'react-native-paper';
import Animated, {
    cancelAnimation,
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    scrollTo,
    SharedValue,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { KeyboardProvider } from './KeyboardProvider';
import { HEADER_HEIGHT, BOTTOM_NAVIGATION_HEIGHT } from '@/constants/size';
import { useDimensions } from '@/services/DimensionsProvider';
import { useReload } from '@/services/ReloadProvider';
import { OVERSCROLL_RELOAD_THRESHOLD, LIST_ITEM_HEIGHT, SCROLL_THROTTLE } from '../constants';
import { IListItem } from '@/types/listItems/core/TListItem';

const TopBlurBar = Animated.createAnimatedComponent(View);
const LoadingSpinner = Animated.createAnimatedComponent(View);
const FloatingBanner = Animated.createAnimatedComponent(View);
const ScrollContainer = Animated.createAnimatedComponent(ScrollView);
const BottomBlurBar = Animated.createAnimatedComponent(View);

export enum LoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

interface TextFieldState<T> {
    current: T | undefined;
    pending?: T | undefined;
}

interface ScrollContainerProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    floatingBanner?: React.ReactNode;
}

interface ScrollContainerContextValue<T extends IListItem> {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    scrollOffsetBounds: SharedValue<{ min: number, max: number }>;
    disableNativeScroll: SharedValue<boolean>;
    // --- List Variables ---
    currentTextfield: T | undefined;
    pendingItem: T | undefined;
    setCurrentTextfield: (current: T | undefined, pending?: T | undefined) => void;

    floatingBannerHeight: number;
}

const ScrollContainerContext = createContext<ScrollContainerContextValue<any> | null>(null);

export const ScrollContainerProvider = ({
    children,
    header,
    floatingBanner
}: ScrollContainerProps) => {
    return (
        <KeyboardProvider>
            <ScrollContainerContent
                floatingBanner={floatingBanner}
                header={header}>
                {children}
            </ScrollContainerContent>
        </KeyboardProvider>
    );
};

/**
 * Provider to allow multiple lists to be rendered within a larger scroll container.
 * 
 * Container allows for native scrolling, or manual scrolling by exposing the @scrollOffset variable.
 * Manual scroll will only work while @disableNativeScroll variable is set to true.
 */
export const ScrollContainerContent = <T extends IListItem>({
    children,
    header,
    floatingBanner
}: ScrollContainerProps) => {

    const {
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        TOP_SPACER,
        BOTTOM_SPACER
    } = useDimensions();

    const {
        reloadPage,
        canReloadPath
    } = useReload();

    // --- Page Layout Variables ---
    const [floatingBannerHeight, setFloatingBannerHeight] = useState(0);
    const contentHeight = useSharedValue(0);
    const visibleHeight = useMemo(() => {
        return SCREEN_HEIGHT - HEADER_HEIGHT - TOP_SPACER - floatingBannerHeight - BOTTOM_NAVIGATION_HEIGHT - BOTTOM_SPACER;
    }, [floatingBannerHeight]);

    // Blur the space behind floating banners
    // If no floating banner exists, blur for the default header height
    const UPPER_FADE_HEIGHT = (floatingBannerHeight > 0 ? floatingBannerHeight : HEADER_HEIGHT) + TOP_SPACER;

    // --- List Variables ---
    const [textFieldState, setTextFieldState] = useState<TextFieldState<T>>({
        current: undefined,
        pending: undefined
    });
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.STATIC);
    const loadingAnimationTrigger = useSharedValue<LoadingStatus>(LoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

    // --- Scroll Variables ---
    const disableNativeScroll = useSharedValue(false);
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const scrollOffset = useSharedValue(0);
    const scrollOffsetBounds = useDerivedValue(() => {
        const min = 0;
        const max = Math.max(0, contentHeight.value - visibleHeight);
        return { min, max };
    });


    // Trigger a page reload
    useEffect(() => {
        if (loadingStatus === LoadingStatus.LOADING) {
            reloadPage().then(() => {
                updateLoadingStatus(LoadingStatus.COMPLETE);
            });
        }
    }, [loadingStatus]);

    // ------------- Utility Functions -------------

    const setCurrentTextfield = (current: T | undefined, pending?: T | undefined) => {
        setTextFieldState({
            current,
            pending
        });
    };

    /**
     * Ensures accurate allignment of animated and state variables for the loading spinner.
     */
    const updateLoadingStatus = (newStatus: LoadingStatus) => {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
    };

    const triggerHaptic = () => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    };

    // ------------- Animated Reactions -------------

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

            // Detect pull-to-refresh action
            if (canReloadPath) {

                // Trigger a reload of the list
                if (loadingAnimationTrigger.value === LoadingStatus.STATIC && current <= -OVERSCROLL_RELOAD_THRESHOLD) {
                    runOnJS(updateLoadingStatus)(LoadingStatus.LOADING);
                }

                // Allow refreshes when scroll returns to top
                if (current >= 0 && loadingAnimationTrigger.value === LoadingStatus.COMPLETE) {
                    runOnJS(updateLoadingStatus)(LoadingStatus.STATIC);
                }
            }

        }
    );

    // Loading Spinner
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

    // ------------- Animated Styles -------------

    // Hides the upper fade while the scroll container is not scrolled
    const topBlurBarStyle = useAnimatedStyle(
        () => ({
            opacity: interpolate(
                scrollOffset.value,
                [0, HEADER_HEIGHT],
                [0, 1],
                Extrapolation.CLAMP
            ),
            height: UPPER_FADE_HEIGHT,
            width: SCREEN_WIDTH,
            position: 'absolute',
            top: 0,
            zIndex: 2,
        }),
        [scrollOffset.value]
    );

    const loadingSpinnerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            Math.min(0, scrollOffset.value),
            [-OVERSCROLL_RELOAD_THRESHOLD / 2, -OVERSCROLL_RELOAD_THRESHOLD],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [
                { rotate: `${loadingRotation.value}deg` },
            ],
            position: 'absolute',
            top: TOP_SPACER + OVERSCROLL_RELOAD_THRESHOLD / 3,
            alignSelf: 'center',
            zIndex: 1,
        };
    });

    const floatingBannerStyle = useAnimatedStyle(
        () => ({
            top: Math.max(TOP_SPACER, (header ? HEADER_HEIGHT : 0) + TOP_SPACER - scrollOffset.value),
        }),
        [scrollOffset.value]
    );

    const bottomBlurBarStyle = useAnimatedStyle(() => {
        const currentScrollBottom = scrollOffset.value + SCREEN_HEIGHT;
        const shouldBeVisible = scrollOffset.value < scrollOffsetBounds.value.max;
        // currentScrollBottom < contentHeight.value; TODO: fix interpolation

        const opacity = interpolate(
            currentScrollBottom,
            [contentHeight.value - LIST_ITEM_HEIGHT, contentHeight.value],
            [1, 0],
            Extrapolation.CLAMP
        );

        return {
            opacity: shouldBeVisible ? 1 : 0,
        };
    });

    // ------------- Render Helper Functions -------------

    /**
     * Creates a gradient blur effect that intensifies toward the top of the screen.
     */
    const renderTopFadeOut = () => {
        const fadeViews = [];
        const blurViews = [];
        const INTENSITY = 5;
        const NUM_VIEWS = 10;
        const ADDITIONAL_BLUR_PADDING = 16;

        for (let i = 1; i <= NUM_VIEWS; i++) {
            blurViews.push(
                <BlurView
                    key={`${i}-blur`}
                    intensity={INTENSITY}
                    tint='systemUltraThinMaterialDark'
                    style={{
                        height: (UPPER_FADE_HEIGHT / NUM_VIEWS) * i,
                        width: SCREEN_WIDTH,
                        position: 'absolute',
                        top: 0,
                        zIndex: 1,
                    }}
                />
            )
            fadeViews.push(
                <View
                    key={`${i}-fade`}
                    style={{
                        height: ((UPPER_FADE_HEIGHT / NUM_VIEWS) * i),
                        width: SCREEN_WIDTH,
                        position: 'absolute',
                        top: 0,
                        zIndex: 1,
                        opacity: .1,
                        backgroundColor: PlatformColor('systemBackground')
                    }} />
            )
        }

        return (
            <View>
                {fadeViews}
                {blurViews}
                <BlurView
                    intensity={4}
                    tint='systemUltraThinMaterialDark'
                    style={{
                        height: UPPER_FADE_HEIGHT + ADDITIONAL_BLUR_PADDING,
                        width: SCREEN_WIDTH,
                        position: 'absolute',
                        top: 0,
                        zIndex: 1,
                    }}
                />
            </View>
        );
    };

    return (
        <ScrollContainerContext.Provider value={{
            currentTextfield: textFieldState.current,
            pendingItem: textFieldState.pending,
            setCurrentTextfield,
            scrollOffset,
            disableNativeScroll,
            scrollOffsetBounds,
            floatingBannerHeight
        }}>

            {/* Floating Banner */}
            <FloatingBanner
                style={[
                    styles.floatingBanner,
                    floatingBannerStyle
                ]}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setFloatingBannerHeight(height);
                }}
            >
                {floatingBanner}
            </FloatingBanner>

            {/* Scroll Container */}
            <ScrollContainer
                ref={scrollRef}
                scrollEventThrottle={SCROLL_THROTTLE}
                scrollToOverflowEnabled={true}
                onScroll={handler}
                contentContainerStyle={{
                    paddingTop: TOP_SPACER,
                    paddingBottom: BOTTOM_SPACER + BOTTOM_NAVIGATION_HEIGHT,
                    flexGrow: 1
                }}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    contentHeight.value = height;
                }}
            >

                {/* Header */}
                {header && (
                    <View style={{
                        height: HEADER_HEIGHT,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                    }}>
                        {header}
                    </View>
                )}

                {/* Floating Banner Spacer */}
                <View style={{ width: '100%', height: floatingBannerHeight }} />

                {/* Loading Spinner */}
                {canReloadPath && (
                    <Portal>
                        <LoadingSpinner style={loadingSpinnerStyle}>
                            <GenericIcon
                                size='l'
                                platformColor={loadingStatus === LoadingStatus.COMPLETE ? 'systemBlue' : 'secondaryLabel'}
                                type={loadingStatus === LoadingStatus.COMPLETE ? 'refreshComplete' : 'refresh'}
                            />
                        </LoadingSpinner>
                    </Portal>
                )}

                {children}

            </ScrollContainer>

            {/* Upper Blur Bar */}
            <TopBlurBar style={topBlurBarStyle}>
                {renderTopFadeOut()}
            </TopBlurBar>

            {/* Bottom Blur Bar */}
            <BottomBlurBar style={bottomBlurBarStyle}>
                <BlurView
                    tint='systemUltraThinMaterial'
                    intensity={100}
                    style={{
                        height: BOTTOM_NAVIGATION_HEIGHT + BOTTOM_SPACER,
                        width: SCREEN_WIDTH,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                    }}
                />
            </BottomBlurBar>

        </ScrollContainerContext.Provider>
    );
};

const styles = StyleSheet.create({
    floatingBanner: {
        position: 'absolute',
        zIndex: 3,
        display: 'flex',
        justifyContent: 'center',
        width: Dimensions.get('window').width
    }
});

export const useScrollContainer = () => {
    const context = useContext(ScrollContainerContext);
    if (!context) {
        throw new Error("useSortableList must be used within a Provider");
    }
    return context;
};