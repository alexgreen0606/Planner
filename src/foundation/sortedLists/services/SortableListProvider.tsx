import React, { createContext, useContext, useEffect, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    useAnimatedReaction,
    SharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    runOnJS,
    cancelAnimation,
    withTiming,
    Easing,
    withRepeat,
    useDerivedValue,
} from 'react-native-reanimated';
import { ListItem } from '../types';
import { Dimensions, PlatformColor, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardProvider, useKeyboard } from './KeyboardProvider';
import { LIST_ITEM_HEIGHT, OVERSCROLL_RELOAD_THRESHOLD, SCROLL_THROTTLE } from '../constants';
import { useNavigation } from '../../navigation/services/NavigationProvider';
import { BlurView } from 'expo-blur';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import useDimensions from '../../hooks/useDimensions';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, Screens } from '../../navigation/constants';
import { Portal } from 'react-native-paper';
import GenericIcon from '../../components/GenericIcon';

const TopBlurBar = Animated.createAnimatedComponent(View);
const LoadingSpinner = Animated.createAnimatedComponent(View);
const FloatingBanner = Animated.createAnimatedComponent(View);
const ScrollContainer = Animated.createAnimatedComponent(ScrollView);
const KeyboardFiller = Animated.createAnimatedComponent(View);
const BottomBlurBar = Animated.createAnimatedComponent(View);

const reloadableScreens = [
    Screens.DASHBOARD,
    Screens.DEADLINES,
    Screens.PLANNERS
];

export enum LoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

interface TextFieldState<T> {
    current: T | undefined;
    pending?: T | undefined;
}

interface SortableListProviderProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    floatingBanner?: React.ReactNode;
}

interface SortableListContextValue<T extends ListItem> {
    // --- Scroll Variables ---
    scrollOffset: SharedValue<number>;
    scrollOffsetBounds: SharedValue<{ min: number, max: number }>;
    disableNativeScroll: SharedValue<boolean>;
    // --- List Variables ---
    currentTextfield: T | undefined;
    pendingItem: T | undefined;
    setCurrentTextfield: (current: T | undefined, pending?: T | undefined) => void;
    // --- Height Trackers ---
    emptySpaceHeight: SharedValue<number>;
}

const SortableListContext = createContext<SortableListContextValue<any> | null>(null);

export const SortableListProvider = ({
    children,
    header,
    floatingBanner
}: SortableListProviderProps) => {
    return (
        <KeyboardProvider>
            <SortableListProviderContent
                floatingBanner={floatingBanner}
                header={header}>
                {children}
            </SortableListProviderContent>
        </KeyboardProvider>
    );
};

/**
 * Provider to allow multiple lists to be rendered within a larger scroll container.
 * 
 * Container allows for native scrolling, or manual scrolling by exposing the @scrollOffset variable.
 * Manual scroll will only work while @disableNativeScroll variable is set to true.
 */
export const SortableListProviderContent = <T extends ListItem>({
    children,
    header,
    floatingBanner
}: SortableListProviderProps) => {

    const {
        screenWidth,
        topSpacer,
        bottomSpacer
    } = useDimensions();

    const {
        currentScreen,
        reloadCurrentPage,
    } = useNavigation();

    const { keyboardHeight } = useKeyboard();

    // --- Page Layout Variables ---
    const [floatingBannerHeight, setFloatingBannerHeight] = useState(0);
    const contentHeight = useSharedValue(0);
    const visibleHeight = useSharedValue(0);
    const emptySpaceHeight = useSharedValue(0);

    // Blur the space behind floating banners
    // If no floating banner exists, blur for the default header height
    const UPPER_FADE_HEIGHT = floatingBannerHeight ? floatingBannerHeight + topSpacer : HEADER_HEIGHT;

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
        const max = Math.max(0, contentHeight.value - visibleHeight.value - emptySpaceHeight.value);
        return { min, max };
    });

    // Trigger a page reload
    useEffect(() => {
        if (loadingStatus === LoadingStatus.LOADING) {
            reloadCurrentPage().then(() => {
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
            if (reloadableScreens.includes(currentScreen)) {

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
            width: screenWidth,
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
            top: topSpacer + OVERSCROLL_RELOAD_THRESHOLD / 3,
            alignSelf: 'center',
            zIndex: 1,
        };
    });

    const floatingBannerStyle = useAnimatedStyle(
        () => ({
            top: Math.max(topSpacer, (header ? HEADER_HEIGHT : 0) + topSpacer - scrollOffset.value),
        }),
        [scrollOffset.value]
    );

    const keyboardFillerStyle = useAnimatedStyle(
        () => ({
            width: 100,
            height: keyboardHeight.value
        }),
        [keyboardHeight.value]
    );

    const bottomBlurBarStyle = useAnimatedStyle(
        () => {
            const opacity = interpolate(
                scrollOffset.value,
                [scrollOffsetBounds.value.max - LIST_ITEM_HEIGHT, scrollOffsetBounds.value.max],
                [1, 0],
            );
            return { opacity };
        },
        [scrollOffset.value, scrollOffsetBounds.value, emptySpaceHeight.value]
    );

    // ------------- Render Helper Functions -------------

    /**
     * Creates a gradient blur effect that intensifies toward the top of the screen.
     */
    const renderTopFadeOut = () => {
        const fadeViews = [];
        const blurViews = [];
        const INTENSITY = 5;
        const NUM_VIEWS = 10;
        const ADDITIONAL_BLUR_PADDING = 8;

        for (let i = 1; i <= NUM_VIEWS; i++) {
            blurViews.push(
                <BlurView
                    key={`${i}-blur`}
                    intensity={INTENSITY}
                    tint='systemUltraThinMaterialDark'
                    style={{
                        height: ((UPPER_FADE_HEIGHT / NUM_VIEWS) * i) + ADDITIONAL_BLUR_PADDING,
                        width: screenWidth,
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
                        height: ((UPPER_FADE_HEIGHT / NUM_VIEWS) * i) + ADDITIONAL_BLUR_PADDING,
                        width: screenWidth,
                        position: 'absolute',
                        top: 0,
                        zIndex: 1,
                        opacity: 1 / i,
                        backgroundColor: PlatformColor('systemBackground')
                    }} />
            )
        }

        return (
            <View>
                {fadeViews}
                {blurViews}
            </View>
        );
    };

    return (
        <SortableListContext.Provider
            value={{
                currentTextfield: textFieldState.current,
                pendingItem: textFieldState.pending,
                setCurrentTextfield,
                scrollOffset,
                disableNativeScroll,
                scrollOffsetBounds,
                emptySpaceHeight
            }}
        >

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
                contentContainerStyle={{ flexGrow: 1, paddingTop: topSpacer }}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    visibleHeight.value = height - BOTTOM_NAVIGATION_HEIGHT - keyboardHeight.value;
                }}
            >
                <View style={{ flex: 1 }} onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    contentHeight.value = height;
                }}>

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

                    {/* Fill Space Behind Floating Banner */}
                    <View style={{ height: floatingBannerHeight }} />

                    {/* Loading Spinner */}
                    {reloadableScreens.includes(currentScreen) && (
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

                    {/* Fill Space Behind Keyboard */}
                    <KeyboardFiller style={keyboardFillerStyle} />
                </View>
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
                        height: BOTTOM_NAVIGATION_HEIGHT + bottomSpacer,
                        width: screenWidth,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                    }}
                />
            </BottomBlurBar>

        </SortableListContext.Provider>
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

export const useSortableList = () => {
    const context = useContext(SortableListContext);
    if (!context) {
        throw new Error("useSortableList must be used within a Provider");
    }
    return context;
};