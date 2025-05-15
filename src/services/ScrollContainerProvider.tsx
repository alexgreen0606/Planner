import GenericIcon from '@/components/GenericIcon';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, spacing, TOOLBAR_HEIGHT } from '@/constants/layout';
import { OVERSCROLL_RELOAD_THRESHOLD, SCROLL_THROTTLE } from '@/constants/listConstants';
import { useDimensions } from '@/services/DimensionsProvider';
import { useReload } from '@/services/ReloadProvider';
import { IListItem } from '@/types/listItems/core/TListItem';
import { BlurView } from 'expo-blur';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { KeyboardAvoidingView, PlatformColor, ScrollView, View } from 'react-native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { Portal } from 'react-native-paper';
import Animated, {
    AnimatedRef,
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
    scrollRef: AnimatedRef<Animated.ScrollView>;
    scrollOffset: SharedValue<number>;
    scrollOffsetBounds: SharedValue<{ min: number, max: number }>;
    disableNativeScroll: SharedValue<boolean>;
    // --- List Variables ---
    currentTextfield: T | undefined;
    pendingItem: T | undefined;
    setCurrentTextfield: (current: T | undefined, pending?: T | undefined) => void;
    // --- Page Layout Variables ---
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

    const LOWER_CONTAINER_PADDING = BOTTOM_SPACER + BOTTOM_NAVIGATION_HEIGHT;
    const VISIBLE_HEIGHT = SCREEN_HEIGHT - LOWER_CONTAINER_PADDING;

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
        const max = Math.max(0, contentHeight.value - VISIBLE_HEIGHT);
        return { min, max };
    });

    // ------------- Utility Functions -------------

    const setCurrentTextfield = (current: T | undefined, pending?: T | undefined) => {
        setTextFieldState({
            current,
            pending
        });
    };

    const triggerHaptic = () => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    };

    // ------------- Reload Logic -------------

    // Trigger a page reload
    useEffect(() => {
        if (loadingStatus === LoadingStatus.LOADING) {
            reloadPage().then(() => {
                updateLoadingStatus(LoadingStatus.COMPLETE);
            });
        }
    }, [loadingStatus]);

    /**
     * Ensures accurate allignment of animated and state variables for the loading spinner.
     */
    const updateLoadingStatus = (newStatus: LoadingStatus) => {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
    };

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

    const loadingSpinnerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            Math.min(0, scrollOffset.value),
            [-OVERSCROLL_RELOAD_THRESHOLD / 2, -OVERSCROLL_RELOAD_THRESHOLD],
            [0, 1],
            Extrapolation.CLAMP
        ),
        transform: [
            { rotate: `${loadingRotation.value}deg` },
        ],
        top: TOP_SPACER + OVERSCROLL_RELOAD_THRESHOLD / 3
    }));

    // ------------- Scrolling Logic -------------

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

    // ------------- Floating Banner Logic -------------

    const floatingBannerStyle = useAnimatedStyle(() => ({
        top: Math.max(
            TOP_SPACER,
            (header ? HEADER_HEIGHT : 0) + TOP_SPACER - scrollOffset.value
        ),
    }));

    // ------------- Blur Bar Logic -------------

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
                    className='absolute top-0 left-0 z-[1] w-screen'
                    style={{
                        height: (UPPER_FADE_HEIGHT / NUM_VIEWS) * i
                    }}
                />
            )
            fadeViews.push(
                <View
                    key={`${i}-fade`}
                    className='absolute z-[1] top-0 left-0 opacity-[.1] w-screen'
                    style={{
                        height: ((UPPER_FADE_HEIGHT / NUM_VIEWS) * i),
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
                    className='absolute top-0 left-0 z-[1] w-screen'
                    style={{
                        height: UPPER_FADE_HEIGHT + ADDITIONAL_BLUR_PADDING
                    }}
                />
            </View>
        );
    };

    // Hides the upper fade while the scroll container is not scrolled
    const topBlurBarStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollOffset.value,
            [0, HEADER_HEIGHT],
            [0, 1],
            Extrapolation.CLAMP
        ),
        height: UPPER_FADE_HEIGHT
    }));

    const bottomBlurBarStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollOffset.value + LOWER_CONTAINER_PADDING,
            [scrollOffsetBounds.value.max - LOWER_CONTAINER_PADDING, scrollOffsetBounds.value.max],
            [1, 0],
            Extrapolation.CLAMP
        )
    }));

    return (
        <ScrollContainerContext.Provider value={{
            currentTextfield: textFieldState.current,
            pendingItem: textFieldState.pending,
            setCurrentTextfield,
            scrollOffset,
            scrollRef,
            disableNativeScroll,
            scrollOffsetBounds,
            floatingBannerHeight
        }}>

            {/* Floating Banner */}
            <FloatingBanner
                className="absolute z-[3] flex justify-center w-full"
                style={floatingBannerStyle}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setFloatingBannerHeight(height);
                }}
            >
                {floatingBanner}
            </FloatingBanner>

            {/* Scroll Container */}
            <KeyboardAvoidingView
                keyboardVerticalOffset={TOOLBAR_HEIGHT + spacing.medium}
                behavior='padding'
                className='flex-1'
            >
                <ScrollContainer
                    ref={scrollRef}
                    scrollEventThrottle={SCROLL_THROTTLE}
                    scrollToOverflowEnabled={true}
                    onScroll={handler}
                    contentContainerStyle={{
                        paddingTop: TOP_SPACER,
                        paddingBottom: LOWER_CONTAINER_PADDING,
                        flexGrow: 1,
                    }}
                    onContentSizeChange={(_, height) => {
                        contentHeight.value = height;
                    }}
                >

                    {/* Header */}
                    {header && (
                        <View
                            className='py-2 px-4'
                            style={{ height: HEADER_HEIGHT }}
                        >
                            {header}
                        </View>
                    )}

                    {/* Floating Banner Spacer */}
                    <View
                        className='w-full'
                        style={{ height: floatingBannerHeight }}
                    />

                    {/* Loading Spinner */}
                    {canReloadPath && (
                        <Portal>
                            <LoadingSpinner
                                className='absolute z-[1] self-center'
                                style={loadingSpinnerStyle}
                            >
                                <GenericIcon
                                    size='l'
                                    platformColor={loadingStatus === LoadingStatus.COMPLETE ?
                                        'systemBlue' : 'secondaryLabel'
                                    }
                                    type={loadingStatus === LoadingStatus.COMPLETE ?
                                        'refreshComplete' : 'refresh'
                                    }
                                />
                            </LoadingSpinner>
                        </Portal>
                    )}

                    {children}

                </ScrollContainer>
            </KeyboardAvoidingView>

            {/* Top Blur Bar */}
            <TopBlurBar
                className='absolute top-0 left-0 z-[2] w-screen'
                style={topBlurBarStyle}
            >
                {renderTopFadeOut()}
            </TopBlurBar>

            {/* Bottom Blur Bar */}
            <BottomBlurBar
                className="absolute bottom-0 left-0 w-screen"
                style={bottomBlurBarStyle}
            >
                <BlurView
                    tint="systemUltraThinMaterial"
                    intensity={100}
                    className='w-screen'
                    style={{ height: LOWER_CONTAINER_PADDING }}
                />
            </BottomBlurBar>

        </ScrollContainerContext.Provider>
    );
};

export const useScrollContainer = () => {
    const context = useContext(ScrollContainerContext);
    if (!context) {
        throw new Error("useSortableList must be used within a Provider");
    }
    return context;
};