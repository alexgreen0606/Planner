import { useScrollContainer } from '@/services/ScrollContainer';
import React from 'react';
import { View } from 'react-native';
import Animated, { runOnUI } from 'react-native-reanimated';

const ScrollAnchorView = Animated.createAnimatedComponent(View);

export const ScrollAnchor = () => {
    const { bottomScrollRef, measureContentHeight } = useScrollContainer();
    return <ScrollAnchorView
        className='h-1 w-full'
        style={{ backgroundColor: 'red' }}
        ref={bottomScrollRef}
       onLayout={runOnUI(measureContentHeight)}
    />;
};

export default ScrollAnchor;