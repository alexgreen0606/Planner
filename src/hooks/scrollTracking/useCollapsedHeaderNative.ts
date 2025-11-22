import { useState } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

import { useScrollOffsetRegistry } from '@/providers/ScrollOffsetRegistry';

const useCollapsedHeaderNative = (
    key: string,
    headerHeight: number
) => {
    const scrollRegistry = useScrollOffsetRegistry();
    const scrollY = scrollRegistry.get(key) ?? { value: 0 };

    const [isCollapsed, setIsCollapsed] = useState(false);

    const threshold = -headerHeight + 1;
    useAnimatedReaction(
        () => scrollY.value,
        (offset) => {
            if (!isCollapsed && offset >= threshold) {
                runOnJS(setIsCollapsed)(true);
            } else if (isCollapsed && offset < threshold) {
                runOnJS(setIsCollapsed)(false);
            }
        }
    );

    return isCollapsed;
};

export default useCollapsedHeaderNative;