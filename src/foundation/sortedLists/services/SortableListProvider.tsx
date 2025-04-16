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
    interpolate,
    Extrapolation,
    runOnJS,
    cancelAnimation,
    withTiming,
    Easing,
    withRepeat,
} from 'react-native-reanimated';
import { ListItem } from '../types';
import { Dimensions, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { KeyboardProvider, useKeyboard } from './KeyboardProvider';
import { LIST_ITEM_HEIGHT, OVERSCROLL_RELOAD_THRESHOLD, SCROLL_THROTTLE } from '../constants';
import { useNavigation } from '../../navigation/services/NavigationProvider';
import { BlurView } from 'expo-blur';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import LinearGradient from 'react-native-linear-gradient';
import useDimensions from '../../hooks/useDimensions';
import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, Screens } from '../../navigation/constants';
import { Portal } from 'react-native-paper';
import GenericIcon from '../../components/GenericIcon';

const AnimatedReload = Animated.createAnimatedComponent(View);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedFiller = Animated.createAnimatedComponent(View);
const AnimatedBanner = Animated.createAnimatedComponent(View);
const AnimatedFloatingBanner = Animated.createAnimatedComponent(View);

const reloadableScreens = [Screens.DASHBOARD, Screens.DEADLINES, Screens.PLANNERS];

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
}

export enum LoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
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
 * Manual scroll will only work while @isManualScrolling variable is set to true.
 */
export const SortableListProviderContent = <T extends ListItem>({
    children,
    header,
    floatingBanner
}: SortableListProviderProps) => {

    const {
        screenWidth,
        topSpacer,
    } = useDimensions();

    const {
        currentScreen,
        reloadCurrentPage,
    } = useNavigation();

    const [floatingBannerHeight, setFloatingBannerHeight] = useState(0);
    const theme = useColorScheme();
    const fadedOpacity = theme === 'dark' ? 'rgba(0,0,0,' : 'rgba(255,255,255,';
    const totalHeaderHeight = topSpacer + (header ? HEADER_HEIGHT : 0) + floatingBannerHeight;

    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.STATIC);
    const loadingAnimationTrigger = useSharedValue<LoadingStatus>(LoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

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

    const updateLoadingStatus = (newStatus: LoadingStatus) => {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
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
                [0, HEADER_HEIGHT],
                [0, 1],
                Extrapolation.CLAMP
            ),
            height: totalHeaderHeight,
            width: screenWidth,
            position: 'absolute',
            top: 0,
            zIndex: 2,
        };
    });

    const floatingBannerStyle = useAnimatedStyle(() => {
        return {
            top: Math.max(topSpacer, (header ? HEADER_HEIGHT : 0) + topSpacer - scrollOffset.value),
        }
    },
        [scrollOffset.value]
    );

    const renderTopBlurViews = () => {
        const blurViews = [];
        const numViews = 10;

        for (let i = 1; i <= numViews; i++) {
            const intensity = 5;

            blurViews.push(
                <BlurView
                    key={i}
                    intensity={intensity}
                    tint='systemUltraThinMaterialDark'
                    style={{
                        height: ((totalHeaderHeight / numViews) * i) + 8,
                        width: screenWidth,
                        position: 'absolute',
                        top: 0,
                        zIndex: 1
                    }}
                />
            )
        }

        return blurViews
    };

    // Reload data when loadingStatus changes to LOADING
    useEffect(() => {
        if (loadingStatus === LoadingStatus.LOADING) {
            reloadCurrentPage().then(() => {
                updateLoadingStatus(LoadingStatus.COMPLETE);
            });
        }
    }, [loadingStatus]);

    const triggerHaptic = () => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    };

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

    return (
        <SortableListContext.Provider
            value={{
                currentTextfield: textFieldState.current,
                setCurrentTextfield,
                scrollOffset,
                disableNativeScroll,
                scrollOffsetBounds,
                pendingItem: textFieldState.pending,
            }}
        >

            {/* Floating Banner */}
            <AnimatedFloatingBanner
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
            </AnimatedFloatingBanner>

            {/* Scroll Container */}
            <AnimatedScrollView
                ref={scrollRef}
                scrollEventThrottle={SCROLL_THROTTLE}
                scrollToOverflowEnabled={true}
                onScroll={handler}
                contentContainerStyle={{ flexGrow: 1, paddingTop: topSpacer }}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    setVisibleHeight(height);
                }}
            >
                <View style={{ flex: 1 }} onLayout={(event) => {
                    const { height: contentHeight } = event.nativeEvent.layout;
                    const maxScroll = Math.max(0, contentHeight - (visibleHeight - BOTTOM_NAVIGATION_HEIGHT - LIST_ITEM_HEIGHT));
                    scrollOffsetBounds.value = {
                        min: 0,
                        max: maxScroll
                    };
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
                            <AnimatedReload style={loadingIconStyle}>
                                <GenericIcon
                                    size='l'
                                    platformColor={loadingStatus === LoadingStatus.COMPLETE ? 'systemBlue' : 'secondaryLabel'}
                                    type={loadingStatus === LoadingStatus.COMPLETE ? 'refreshComplete' : 'refresh'}
                                />
                            </AnimatedReload>
                        </Portal>
                    )}

                    {children}

                    {/* Fill Space Behind Keyboard */}
                    <AnimatedFiller style={keyboardPadboxStyle} />
                </View>
            </AnimatedScrollView>

            {/* Upper Blur Bar */}
            <AnimatedBanner style={bannerStyle}>
                {renderTopBlurViews()}
                <LinearGradient
                    colors={[`${fadedOpacity}1)`, `${fadedOpacity}0)`]}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: screenWidth,
                        height: totalHeaderHeight
                    }}
                />
            </AnimatedBanner>
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