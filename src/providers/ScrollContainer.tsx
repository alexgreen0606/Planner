import GenericIcon from '@/components/icon';
import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import RecurringEventToolbar from '@/components/toolbars/RecurringEventToolbar';
import useAppTheme from '@/hooks/useAppTheme';
import { LIST_ITEM_HEIGHT, OVERSCROLL_RELOAD_THRESHOLD, SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, TOOLBAR_HEIGHT } from '@/lib/constants/miscLayout';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
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
    useAnimatedKeyboard,
    useAnimatedReaction,
    useAnimatedRef,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalDataContext } from './ExternalDataProvider';

// ✅ 

type TScrollContainerProviderProps = {
    children: React.ReactNode;
    header?: React.ReactNode;
    floatingBanner?: React.ReactNode;
    floatingBannerHeight?: number;
    fixFloatingBannerOnOverscroll?: boolean;

    // Tracks the height of any content above the list container
    upperContentHeight?: number;
};

type TScrollContainerContextValue = {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    onAutoScroll: (newOffset: number) => void;

    // --- Page Layout Variables ---
    floatingBannerHeight: number;
    bottomScrollRef: AnimatedRef<Animated.View>;
    onMeasureScrollContentHeight: () => void;

    // Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
};

export enum ELoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

const TopBlurBarContainer = Animated.createAnimatedComponent(View);
const LoadingSpinner = Animated.createAnimatedComponent(View);
const FloatingBanner = Animated.createAnimatedComponent(View);
const ScrollContainer = Animated.createAnimatedComponent(ScrollView);

const ScrollContainerContext = createContext<TScrollContainerContextValue | null>(null);

export const ScrollContainerProvider = ({
    children,
    header,
    floatingBanner,
    upperContentHeight = 0,
    floatingBannerHeight: fixedFloatingBannerHeight = 0,
    fixFloatingBannerOnOverscroll = false
}: TScrollContainerProviderProps) => {
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const keyboard = useAnimatedKeyboard();
    const pathname = usePathname();

    const { onReloadPage } = useExternalDataContext();

    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const bottomScrollRef = useAnimatedRef<Animated.View>();

    const placeholderInputRef = useRef<TextInput>(null);

    const [floatingBannerHeight, setFloatingBannerHeight] = useState(fixedFloatingBannerHeight);
    const [loadingStatus, setLoadingStatus] = useState<ELoadingStatus>(ELoadingStatus.STATIC);
    const [blurBottomNav, setBlurBottomNav] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const bottomAnchorAbsolutePosition = useSharedValue(0);
    const disableNativeScroll = useSharedValue(false);
    const scrollOffset = useSharedValue(0);

    const loadingAnimationTrigger = useSharedValue<ELoadingStatus>(ELoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

    const { background } = useAppTheme();

    const UPPER_CONTAINER_PADDING = TOP_SPACER + (header ? HEADER_HEIGHT : 0) + floatingBannerHeight + upperContentHeight;
    const LOWER_CONTAINER_PADDING = BOTTOM_SPACER + BOTTOM_NAVIGATION_HEIGHT;
    const VISIBLE_HEIGHT = SCREEN_HEIGHT - LOWER_CONTAINER_PADDING;

    // Blur the space behind floating banners
    // If no floating banner exists, blur for the default header height
    const UPPER_FADE_HEIGHT = (floatingBannerHeight > 0 ? floatingBannerHeight : HEADER_HEIGHT) + TOP_SPACER;

    const canReloadPath = reloadablePaths.includes(pathname);

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

    const floatingBannerStyle = useAnimatedStyle(() => {
        const baseOffset = (header ? HEADER_HEIGHT : 0) + TOP_SPACER;
        const shouldFixPositionToTop = scrollOffset.value <= 0 && fixFloatingBannerOnOverscroll;
        const calculatedTop = baseOffset - scrollOffset.value;
        return {
            top: shouldFixPositionToTop ? baseOffset : Math.max(TOP_SPACER, calculatedTop),
        };
    });

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

    // Trigger a page reload on overscroll.
    useEffect(() => {
        const executeReload = async () => {
            await onReloadPage();
            updateLoadingStatus(ELoadingStatus.COMPLETE);
        }

        if (loadingStatus === ELoadingStatus.LOADING) executeReload();
    }, [loadingStatus]);

    // =====================
    // 1. Exposed Functions
    // =====================

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

    function handleMeasureScrollContentHeight() {
        'worklet';
        try {
            const measured = measure(bottomScrollRef);
            if (measured) {
                bottomAnchorAbsolutePosition.value = UPPER_CONTAINER_PADDING + measured.y - scrollOffset.value;
            }
        } catch (e) { }
    }

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    // ====================
    // 2. Helper Functions
    // ====================

    function triggerHaptic() {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    }

    function updateLoadingStatus(newStatus: ELoadingStatus) {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
    }

    // ==============
    // 3. Animations
    // ==============

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
            handleMeasureScrollContentHeight();
        },
        onMomentumEnd: () => {
            runOnJS(setIsDragging)(false);
            handleMeasureScrollContentHeight();
        }
    });

    // Blur the bottom navbar when content extends behind it.
    useAnimatedReaction(
        () => bottomAnchorAbsolutePosition.value > VISIBLE_HEIGHT,
        (shouldBlur) => {
            runOnJS(setBlurBottomNav)(shouldBlur);
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
            if (curr.status === ELoadingStatus.STATIC) return;
            if (curr.status === ELoadingStatus.LOADING && prev?.status !== ELoadingStatus.LOADING) {
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
            } else if (curr.status === ELoadingStatus.COMPLETE) {
                if (curr.rotation % 360 >= -1) {
                    cancelAnimation(loadingRotation);
                }
            }
        }
    );

    // Manual scroll and overscroll check.
    useAnimatedReaction(
        () => scrollOffset.value,
        (current) => {
            scrollTo(scrollRef, 0, current, false);

            // Detect pull-to-refresh action
            if (canReloadPath) {

                // Trigger a reload of the list
                if (loadingAnimationTrigger.value === ELoadingStatus.STATIC && current <= -OVERSCROLL_RELOAD_THRESHOLD) {
                    runOnJS(updateLoadingStatus)(ELoadingStatus.LOADING);
                }

                // Allow refreshes when scroll returns to top
                if (current >= 0 && loadingAnimationTrigger.value === ELoadingStatus.COMPLETE) {
                    runOnJS(updateLoadingStatus)(ELoadingStatus.STATIC);
                }
            }

        }
    );

    // Track if the keyboard is open.
    useAnimatedReaction(
        () => keyboard.height.value,
        (keyboardHeight) => runOnJS(setIsKeyboardOpen)(keyboardHeight > 0)
    );

    // ======
    // 4. UI
    // ======

    // Creates a gradient blur effect that intensifies toward the top of the screen.
    const TopBlurBar = () => {
        const fadeViews = [];
        const blurViews = [];
        const INTENSITY = 5;
        const NUM_VIEWS = 5;
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
                        backgroundColor: PlatformColor(background)
                    }} />
            )
        }

        return (
            <TopBlurBarContainer
                className='absolute top-0 left-0 z-[2] w-screen'
                style={topBlurBarStyle}
            >
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
            </TopBlurBarContainer>
        );
    };

    return (
        <ScrollContainerContext.Provider value={{
            scrollOffset,
            floatingBannerHeight,
            bottomScrollRef,
            onFocusPlaceholder: handleFocusPlaceholder,
            onAutoScroll: handleAutoScroll,
            onMeasureScrollContentHeight: handleMeasureScrollContentHeight
        }}>
            <View className='flex-1' style={{ backgroundColor: PlatformColor(background) }}>

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
                    keyboardVerticalOffset={TOOLBAR_HEIGHT}
                >
                    {/* Hidden placeholder input to prevent keyboard flicker */}
                    <TextInput
                        ref={placeholderInputRef}
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
                            paddingBottom: isKeyboardOpen ? 0 : LOWER_CONTAINER_PADDING,
                            flexGrow: 1
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

                {/* List Toolbars */}
                <PlannerEventToolbar />
                <FolderItemToolbar />
                <CountdownEventToolbar />
                <RecurringEventToolbar />

                {/* Top Blur Bar */}
                <TopBlurBar />

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
                            platformColor={loadingStatus === ELoadingStatus.COMPLETE ?
                                'systemBlue' : 'secondaryLabel'
                            }
                            type={loadingStatus === ELoadingStatus.COMPLETE ?
                                'refreshComplete' : 'refresh'
                            }
                        />
                    </LoadingSpinner>
                )}

            </View>
        </ScrollContainerContext.Provider>
    )
};

export const useScrollContainerContext = () => {
    const context = useContext(ScrollContainerContext);
    if (!context) {
        throw new Error("useScrollContainer must be used within a ScrollContainerProvider");
    }
    return context;
};