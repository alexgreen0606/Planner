import GenericIcon from '@/components/icon';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, LIST_ITEM_HEIGHT } from '@/lib/constants/layout';
import { OVERSCROLL_RELOAD_THRESHOLD, SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { BlurView } from 'expo-blur';
import { usePathname } from 'expo-router';
import { MotiView } from 'moti';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, PlatformColor, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, {
    AnimatedRef,
    cancelAnimation,
    Easing,
    Extrapolation,
    interpolate,
    measure,
    runOnJS,
    scrollTo,
    SharedValue,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reloadablePaths, useCalendarLoad } from './CalendarProvider';

const TopBlurBar = Animated.createAnimatedComponent(View);
const LoadingSpinner = Animated.createAnimatedComponent(View);
const FloatingBanner = Animated.createAnimatedComponent(View);
const ScrollContainer = Animated.createAnimatedComponent(ScrollView);

export enum LoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

interface ScrollContainerProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    floatingBanner?: React.ReactNode;
    floatingBannerHeight?: number;
    fixFloatingBannerOnOverscroll?: boolean;

    // Tracks the height of any content above the list container
    upperContentHeight?: number;
}

interface ScrollContainerContextValue {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    autoScroll: (newOffset: number) => void;
    // --- Page Layout Variables ---
    floatingBannerHeight: number;
    measureContentHeight: () => void;
    bottomScrollRef: AnimatedRef<Animated.View>;
    // Placeholder Textfield (prevents keyboard flicker)
    focusPlaceholder: () => void;
    blurPlaceholder: () => void;
}

const ScrollContainerContext = createContext<ScrollContainerContextValue | null>(null);

/**
 * Provider to allow multiple lists to be rendered within a larger scroll container.
 * 
 * Container allows for native scrolling, or manual scrolling by exposing the @scrollOffset variable.
 */
export const ScrollContainerProvider = ({
    children,
    header,
    floatingBanner,
    upperContentHeight = 0,
    floatingBannerHeight: fixedFloatingBannerHeight = 0,
    fixFloatingBannerOnOverscroll = false
}: ScrollContainerProps) => {
    const pathname = usePathname();

    const bottomAnchorAbsolutePosition = useSharedValue(0);
    const bottomScrollRef = useAnimatedRef<Animated.View>();

    const placeholderInputRef = useRef<TextInput>(null);

    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();

    const { reloadPage } = useCalendarLoad();

    const canReloadPath = reloadablePaths.includes(pathname);

    // ----- Page Layout Variables -----

    const [blurBottomNav, setBlurBottomNav] = useState(false);


    const [floatingBannerHeight, setFloatingBannerHeight] = useState(fixedFloatingBannerHeight);

    const UPPER_CONTAINER_PADDING = TOP_SPACER + (header ? HEADER_HEIGHT : 0) + floatingBannerHeight + upperContentHeight;
    const LOWER_CONTAINER_PADDING = BOTTOM_SPACER + BOTTOM_NAVIGATION_HEIGHT;
    const VISIBLE_HEIGHT = SCREEN_HEIGHT - LOWER_CONTAINER_PADDING;

    // Blur the space behind floating banners
    // If no floating banner exists, blur for the default header height
    const UPPER_FADE_HEIGHT = (floatingBannerHeight > 0 ? floatingBannerHeight : HEADER_HEIGHT) + TOP_SPACER;

    // -----Loading Spinner Variables -----

    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.STATIC);
    const loadingAnimationTrigger = useSharedValue<LoadingStatus>(LoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

    // ----- Scroll Variables -----

    const scrollOffset = useSharedValue(0);
    const disableNativeScroll = useSharedValue(false);
    const scrollRef = useAnimatedRef<Animated.ScrollView>();

    // ------------- Utility Functions -------------

    function triggerHaptic() {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    }

    // Measures the height of all content within the scroll container.
    const measureContentHeight = () => {
        'worklet';
        try {
            const measured = measure(bottomScrollRef);
            if (measured) {
                bottomAnchorAbsolutePosition.value = UPPER_CONTAINER_PADDING + measured.y - scrollOffset.value;
            }
        } catch (e) { }
    };

    const focusPlaceholder = () => {
        placeholderInputRef.current?.focus();
    };

    const blurPlaceholder = () => {
        placeholderInputRef.current?.blur();
    };

    // ------------- Reload Logic -------------

    // Trigger a page reload
    useEffect(() => {
        const executeReload = async () => {
            await reloadPage();
            updateLoadingStatus(LoadingStatus.COMPLETE);
        }

        if (loadingStatus === LoadingStatus.LOADING) executeReload();
    }, [loadingStatus]);

    // Aligns both the state and animated values for the loading spinner.
    function updateLoadingStatus(newStatus: LoadingStatus) {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
    }

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

    const loadingSpinnerStyle = useAnimatedStyle(() => {
        const baseTop = (fixFloatingBannerOnOverscroll ? floatingBannerHeight : 0)
            + TOP_SPACER
            + OVERSCROLL_RELOAD_THRESHOLD / 3;

        return {
            opacity: interpolate(
                scrollOffset.value,
                [-OVERSCROLL_RELOAD_THRESHOLD, -OVERSCROLL_RELOAD_THRESHOLD / 2],
                [1, 0],
                Extrapolation.CLAMP
            ),
            transform: [{ rotate: `${loadingRotation.value}deg` }],
            top: baseTop,
        };
    });

    // ------------- Scrolling Logic -------------

    const [isDragging, setIsDragging] = useState(false);


    // Native Scroll Handler
    const scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: () => {
            runOnJS(setIsDragging)(true);
        },
        onScroll: (event) => {
            if (!disableNativeScroll.value) {
                scrollOffset.value = event.contentOffset.y;
            }
        },
        onEndDrag: () => {
            runOnJS(setIsDragging)(false);
            measureContentHeight();
        },
        onMomentumEnd: () => {
            runOnJS(setIsDragging)(false);
            measureContentHeight();
        }
    });

    // Manual Scroll Reaction
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

    // Auto Scroll
    const autoScroll = (displacement: number) => {
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
    };

    // ------------- Floating Banner Logic -------------

    const floatingBannerStyle = useAnimatedStyle(() => {
        const baseOffset = (header ? HEADER_HEIGHT : 0) + TOP_SPACER;
        const shouldFixPositionToTop = scrollOffset.value <= 0 && fixFloatingBannerOnOverscroll;
        const calculatedTop = baseOffset - scrollOffset.value;
        return {
            top: shouldFixPositionToTop ? baseOffset : Math.max(TOP_SPACER, calculatedTop),
        };
    });

    // ------------- Blur Bar Logic -------------

    /**
     * Creates a gradient blur effect that intensifies toward the top of the screen.
     */
    function renderTopFadeOut() {
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

    useAnimatedReaction(
        () => bottomAnchorAbsolutePosition.value > VISIBLE_HEIGHT,
        (shouldBlur) => {
            runOnJS(setBlurBottomNav)(shouldBlur);
        }
    );

    return (
        <ScrollContainerContext.Provider value={{
            scrollOffset,
            autoScroll,
            measureContentHeight,
            floatingBannerHeight,
            bottomScrollRef,
            focusPlaceholder,
            blurPlaceholder
        }}>

            {/* Floating Banner */}
            <FloatingBanner
                className="absolute z-[3] flex justify-center w-full px-2"
                style={floatingBannerStyle}
                onLayout={(event) => {
                    if (fixedFloatingBannerHeight) return;

                    const { height } = event.nativeEvent.layout;
                    setFloatingBannerHeight(height);
                }}
            >
                {floatingBanner}
            </FloatingBanner>

            {/* Scroll Container */}
            <KeyboardAvoidingView
                behavior='padding'
                className='flex-1'
            >
                {/* Hidden placeholder input to maintain keyboard */}
                <TextInput
                    ref={placeholderInputRef}
                    inputAccessoryViewID='PLACEHOLDER'
                    returnKeyType='done'
                    style={{ position: 'absolute', left: -9999, width: 1, height: 1 }}
                    autoCorrect={false}
                />
                <ScrollContainer
                    ref={scrollRef}
                    scrollEventThrottle={SCROLL_THROTTLE}
                    scrollToOverflowEnabled={true}
                    onScroll={scrollHandler}
                    keyboardShouldPersistTaps='always'
                    contentContainerStyle={{
                        paddingTop: TOP_SPACER,
                        paddingBottom: LOWER_CONTAINER_PADDING,
                        flexGrow: 1,
                    }}
                >

                    {/* Header */}
                    {header && (
                        <View
                            className='py-2 px-2'
                            style={{ height: HEADER_HEIGHT }}
                        >
                            {header}
                        </View>
                    )}

                    {/* Floating Banner Spacer */}
                    <View className='opacity-0'>
                        {floatingBanner}
                    </View>

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
            <MotiView
                className="absolute bottom-0 w-screen"
                animate={{
                    opacity: (blurBottomNav && !isDragging) ? 1 : 0
                }}
                transition={{
                    type: 'timing',
                    duration: 400
                }}
            >
                <BlurView
                    tint="systemUltraThinMaterial"
                    intensity={100}
                    className='w-screen'
                    style={{ height: LOWER_CONTAINER_PADDING }}
                />
            </MotiView>


            {/* Loading Spinner */}
            {canReloadPath && (
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
            )}

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