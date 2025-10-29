import { THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';

// ✅ 

const ThinLine = () => (
    <View className="w-full justify-center" style={{ height: THIN_LINE_HEIGHT }}>
        <View className="w-full" style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: PlatformColor('systemGray'),
        }} />
    </View>
);

export default ThinLine;
