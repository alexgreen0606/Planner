import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import RecurringEventToolbar from '@/components/toolbars/RecurringEventToolbar';
import UpperFadeOutView from '@/components/UpperFadeOutView';
import useAppTheme from '@/hooks/useAppTheme';
import { LIST_ITEM_HEIGHT, OVERSCROLL_RELOAD_THRESHOLD, SCROLL_THROTTLE } from '@/lib/constants/listConstants';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { CircularProgress, Host } from '@expo/ui/swift-ui';
import { usePathname } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, PlatformColor, ScrollView, TextInput, View } from 'react-native';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, {
    cancelAnimation,
    Easing,
    Extrapolation,
    interpolate,
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
    fixFloatingBannerToTop?: boolean;

    // Tracks the height of any content above the list container
    upperContentHeight?: number;
};

type TScrollContainerContextValue = {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    onAutoScroll: (newOffset: number) => void;

    // --- Page Layout Variables ---
    floatingBannerHeight: number;

    // Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
};

export enum ELoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

const UpperFadeOutContainer = Animated.createAnimatedComponent(View);
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
    fixFloatingBannerToTop = false
}: TScrollContainerProviderProps) => {
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const keyboard = useAnimatedKeyboard();
    const pathname = usePathname();

    const { onReloadPage } = useExternalDataContext();

    const scrollRef = useAnimatedRef<Animated.ScrollView>();

    const placeholderInputRef = useRef<TextInput>(null);

    const [floatingBannerHeight, setFloatingBannerHeight] = useState(fixedFloatingBannerHeight);
    const [loadingStatus, setLoadingStatus] = useState<ELoadingStatus>(ELoadingStatus.STATIC);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const disableNativeScroll = useSharedValue(false);
    const scrollOffset = useSharedValue(0);

    const loadingAnimationTrigger = useSharedValue<ELoadingStatus>(ELoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

    const { background } = useAppTheme();

    const UPPER_CONTAINER_PADDING = TOP_SPACER + (header ? HEADER_HEIGHT : 0) + floatingBannerHeight + upperContentHeight;
    const LOWER_CONTAINER_PADDING = BOTTOM_SPACER + BOTTOM_NAVIGATION_HEIGHT;

    const canReloadPath = reloadablePaths.includes(pathname);

    const loadingSpinnerStyle = useAnimatedStyle(() => {
        const baseTop = floatingBannerHeight
            + TOP_SPACER
            + OVERSCROLL_RELOAD_THRESHOLD / 3;

        return {
            opacity: interpolate(
                scrollOffset.value,
                [-OVERSCROLL_RELOAD_THRESHOLD, -OVERSCROLL_RELOAD_THRESHOLD / 2],
                [1, 0],
                Extrapolation.CLAMP
            ),
            // transform: [{ rotate: `${loadingRotation.value}deg` }],
            top: baseTop,
        };
    });

    const floatingBannerStyle = useAnimatedStyle(() => {
        const baseOffset = (header ? HEADER_HEIGHT : 0) + TOP_SPACER;
        const shouldFixPositionToTop = scrollOffset.value <= 0 && fixFloatingBannerToTop;
        const calculatedTop = baseOffset - scrollOffset.value;
        return {
            top: shouldFixPositionToTop ? baseOffset : Math.max(TOP_SPACER, calculatedTop),
        };
    });

    // Hides the upper fade when the scroll container is not scrolled
    const upperFadeOutStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollOffset.value,
            [0, HEADER_HEIGHT],
            [0, 1],
            Extrapolation.CLAMP
        )
    }));

    // Trigger a page reload on overscroll.
    useEffect(() => {
        const executeReload = async () => {
            await onReloadPage();
            updateLoadingStatus(ELoadingStatus.COMPLETE);
        }

        if (loadingStatus === ELoadingStatus.LOADING) executeReload();
    }, [loadingStatus]);

    // ===================
    //  Exposed Functions
    // ===================

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

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    // ==================
    //  Helper Functions
    // ==================

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

    // ============
    //  Animations
    // ============

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!disableNativeScroll.value) {
                scrollOffset.value = event.contentOffset.y;
            }
        }
    });

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

    // ================
    //  User Interface
    // ================

    return (
        <ScrollContainerContext.Provider value={{
            scrollOffset,
            floatingBannerHeight,
            onFocusPlaceholder: handleFocusPlaceholder,
            onAutoScroll: handleAutoScroll
        }}>
            <View className='flex-1' style={{ backgroundColor: PlatformColor(background) }}>

                {/* Upper Fade Out */}
                <UpperFadeOutContainer
                    className='absolute top-0 left-0 w-screen z-[2]'
                    style={upperFadeOutStyle}
                >
                    <UpperFadeOutView floatingBannerHeight={floatingBannerHeight} />
                </UpperFadeOutContainer>

                {/* Floating Banner */}
                <FloatingBanner
                    className="absolute z-[3] flex justify-center w-full"
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
                // keyboardVerticalOffset={TOOLBAR_HEIGHT}
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

                {/* Loading Spinner */}
                {canReloadPath && (
                    <LoadingSpinner
                        className='absolute z-[1] self-center'
                        style={loadingSpinnerStyle}
                    >
                        {/* <GenericIcon
                            size='l'
                            platformColor={loadingStatus === ELoadingStatus.COMPLETE ?
                                'systemBlue' : 'secondaryLabel'
                            }
                            type={loadingStatus === ELoadingStatus.COMPLETE ?
                                'refreshComplete' : 'refresh'
                            }
                        /> */}
                        <Host matchContents>
                            <CircularProgress />
                        </Host>
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