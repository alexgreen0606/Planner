import { useScrollContainer } from '@/providers/ScrollContainer';
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

// ✅ 

const ScrollAnchorView = Animated.createAnimatedComponent(View);

export const ScrollContainerAnchor = () => {
    const { bottomScrollRef } = useScrollContainer();
    return <ScrollAnchorView ref={bottomScrollRef} />;
};

export default ScrollContainerAnchor;