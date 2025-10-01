import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import RecurringEventToolbar from '@/components/toolbars/RecurringEventToolbar';
import useAppTheme from '@/hooks/useAppTheme';
import { OVERSCROLL_RELOAD_THRESHOLD } from '@/lib/constants/listConstants';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { usePathname } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, TextInput, View } from 'react-native';
import {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExternalDataContext } from './ExternalDataProvider';
import { ScrollProvider } from './ScrollProvider';

// ✅ 

type TPageProviderProps = {
    children: React.ReactNode;
    floatingHeader?: React.ReactNode;
    fadeOutHeader?: boolean;
};

type TPageProviderContextValue = {
    floatingHeaderHeight: number;

    // Focuses Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
};

export enum ELoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

const ScrollPageContext = createContext<TPageProviderContextValue | null>(null);

export const ScrollPageProvider = ({
    floatingHeader,
    fadeOutHeader,
    children
}: TPageProviderProps) => {
    const { top: TOP_SPACER, bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    const pathname = usePathname();

    const { onReloadPage } = useExternalDataContext();

    const placeholderInputRef = useRef<TextInput>(null);

    const [loadingStatus, setLoadingStatus] = useState<ELoadingStatus>(ELoadingStatus.STATIC);
    const [floatingHeaderHeight, setFloatingHeaderHeight] = useState(0);

    const scrollOffset = useSharedValue(0);
    const loadingAnimationTrigger = useSharedValue<ELoadingStatus>(ELoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

    const { background } = useAppTheme();

    const canReloadPath = reloadablePaths.includes(pathname);

    const loadingSpinnerStyle = useAnimatedStyle(() => {
        const baseTop = floatingHeaderHeight
            + TOP_SPACER
            + OVERSCROLL_RELOAD_THRESHOLD / 3;

        return {
            opacity: interpolate(
                scrollOffset.value,
                [-OVERSCROLL_RELOAD_THRESHOLD, -OVERSCROLL_RELOAD_THRESHOLD / 2],
                [1, 0],
                Extrapolation.CLAMP
            ),
            top: baseTop,
        };
    });

    // Trigger a page reload on overscroll.
    useEffect(() => {
        const executeReload = async () => {
            await onReloadPage();
            updateLoadingStatus(ELoadingStatus.COMPLETE);
        }

        if (loadingStatus === ELoadingStatus.LOADING) executeReload();
    }, [loadingStatus]);

    // Overscroll check.
    useAnimatedReaction(
        () => scrollOffset.value,
        (current) => {
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

    // Loading Spinner Animation
    // useAnimatedReaction(
    //     () => ({
    //         status: loadingAnimationTrigger.value,
    //         overscroll: Math.min(0, scrollOffset.value),
    //         rotation: loadingRotation.value
    //     }),
    //     (curr, prev) => {
    //         if (curr.status === ELoadingStatus.STATIC) return;
    //         if (curr.status === ELoadingStatus.LOADING && prev?.status !== ELoadingStatus.LOADING) {
    //             // Begin Spinning Animation
    //             runOnJS(triggerHaptic)();
    //             loadingRotation.value = withRepeat(
    //                 withTiming(loadingRotation.value - 360, {
    //                     duration: 500,
    //                     easing: Easing.linear
    //                 }),
    //                 -1,
    //                 false,
    //             );
    //         } else if (curr.status === ELoadingStatus.COMPLETE) {
    //             if (curr.rotation % 360 >= -1) {
    //                 cancelAnimation(loadingRotation);
    //             }
    //         }
    //     }
    // );

    function triggerHaptic() {
        // ReactNativeHapticFeedback.trigger('impactMedium', {
        //     enableVibrateFallback: true,
        //     ignoreAndroidSystemSettings: false
        // });
    }

    function updateLoadingStatus(newStatus: ELoadingStatus) {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
    }

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    return (
        <ScrollPageContext.Provider value={{
            floatingHeaderHeight,
            onFocusPlaceholder: handleFocusPlaceholder
        }}>
            <KeyboardAvoidingView className='flex-1' behavior='padding'>
                <ScrollProvider
                    scrollOffset={scrollOffset}
                    contentContainerStyle={{
                        flexGrow: 1
                    }}
                >
                    {children}
                </ScrollProvider>
            </KeyboardAvoidingView>

            {/* List Toolbars */}
            <PlannerEventToolbar />
            <FolderItemToolbar />
            <CountdownEventToolbar />
            <RecurringEventToolbar />

            {/* Placeholder Field */}
            <TextInput
                ref={placeholderInputRef}
                returnKeyType='done'
                className='absolute w-1 h-1 left-[9999]'
                autoCorrect={false}
            />
        </ScrollPageContext.Provider>
    )
};


export const useScrollPageContext = () => {
    const context = useContext(ScrollPageContext);
    if (!context) {
        throw new Error("useScrollPageContext must be used within a ScrollPageProvider");
    }
    return context;
};