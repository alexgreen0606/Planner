import { useEffect } from 'react';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { useScrollRegistry } from '@/providers/ScrollRegistry';

export const useScrollTracker = (key: string) => {
    const scrollRegistry = useScrollRegistry();
    const scrollY = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            scrollY.value = e.contentOffset.y;
        }
    });

    // Register the scroll offset tracker.
    useEffect(() => {
        scrollRegistry.set(key, scrollY);
    }, [key, scrollRegistry, scrollY]);

    return onScroll;
};