import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    interpolate,
    runOnJS,
    Extrapolation,
    cancelAnimation,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { View } from 'react-native';
import GenericIcon from '../../components/GenericIcon';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useSortableList } from './SortableListProvider';
import { Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OVERSCROLL_RELOAD_THRESHOLD } from '../constants';
import { BANNER_HEIGHT } from '../../components/constants';

const AnimatedReload = Animated.createAnimatedComponent(View);

export enum LoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

interface ReloadProviderProps {
    children: React.ReactNode;
}

interface ReloadFunction {
    id: string;
    func: () => Promise<void>;
}

interface ReloadContextType {
    addReloadFunction: (id: string, reloadFunc: () => Promise<void>) => void;
}

const ReloadContext = createContext<ReloadContextType | null>(null);

export const ReloadProvider: React.FC<ReloadProviderProps> = ({
    children,
}) => {
    const [reloadFunctions, setReloadFunctions] = useState<Record<string, () => Promise<void>>>({});

    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.STATIC);
    const loadingAnimationTrigger = useSharedValue<LoadingStatus>(LoadingStatus.STATIC);
    const loadingRotation = useSharedValue(0);

    const { scrollOffset } = useSortableList();

    const { top } = useSafeAreaInsets();

    // ------------- Utility Functions -------------

    // Function to add a new reload function
    const addReloadFunction = useCallback((id: string, reloadFunc: () => Promise<void>) => {
        setReloadFunctions(prev => {
            // Only add if the ID doesn't already exist
            if (prev[id]) {
                return prev; // ID already exists, don't update
            }
            return {
                ...prev,
                [id]: reloadFunc
            };
        });
    }, []);

    // Combined reload function that executes all registered functions
    const executeAllReloadFunctions = async () => {
        try {
            // Execute all functions in the map/record
            await Promise.all(Object.values(reloadFunctions).map(func => func()));
        } catch (error) {
            console.error('Error during reload:', error);
        } finally {
            endLoadingData();
        }
    };

    const triggerHaptic = () => {
        ReactNativeHapticFeedback.trigger('impactMedium', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false
        });
    };

    const updateLoadingStatus = (newStatus: LoadingStatus) => {
        setLoadingStatus(newStatus);
        loadingAnimationTrigger.value = newStatus;
    };

    const endLoadingData = () => {
        if (loadingStatus !== LoadingStatus.STATIC) {
            updateLoadingStatus(LoadingStatus.COMPLETE);
        }
    };

    // Reload data when loadingStatus changes to LOADING
    useEffect(() => {
        if (loadingStatus === LoadingStatus.LOADING) {
            executeAllReloadFunctions().then(endLoadingData);
        }
    }, [loadingStatus]);

    // Monitor scroll position to detect pull-to-refresh action
    useAnimatedReaction(
        () => scrollOffset.value,
        (current) => {

            // Trigger a reload of the list
            if (loadingAnimationTrigger.value === LoadingStatus.STATIC && current <= -OVERSCROLL_RELOAD_THRESHOLD) {
                runOnJS(updateLoadingStatus)(LoadingStatus.LOADING);
            }

            // Allow refreshes when scroll returns to top
            if (current >= 0 && loadingAnimationTrigger.value === LoadingStatus.COMPLETE) {
                runOnJS(updateLoadingStatus)(LoadingStatus.STATIC);
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
            top: top + (BANNER_HEIGHT * 1.5),
            alignSelf: 'center',
            zIndex: 1,
        };
    });

    return (
        <ReloadContext.Provider value={{
            addReloadFunction
        }}>
            <Portal>
                <AnimatedReload style={loadingIconStyle}>
                    <GenericIcon
                        size='l'
                        platformColor={loadingStatus === LoadingStatus.COMPLETE ? 'systemBlue' : 'secondaryLabel'}
                        type={loadingStatus === LoadingStatus.COMPLETE ? 'refreshComplete' : 'refresh'}
                    />
                </AnimatedReload>
            </Portal>
            {children}
        </ReloadContext.Provider>
    );
};

export const useReload = () => {
    const context = useContext(ReloadContext);
    if (!context) {
        throw new Error("useReload must be used within a ReloadProvider");
    }
    return context;
};