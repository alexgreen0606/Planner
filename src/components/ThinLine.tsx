import { THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import React from 'react';
import { PlatformColor, StyleSheet } from 'react-native';
import { View } from 'react-native';

// ✅ 

const ThinLine = ({ overflow }: { overflow?: boolean }) =>
    <View className="w-full justify-center" style={{ height: THIN_LINE_HEIGHT }}>
        <View
            className="w-full"
            style={[
                {
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: PlatformColor('systemGray'),
                },
                overflow && {
                    width: '200%',
                    marginLeft: '-50%',
                },
            ]}
        />
    </View>;

export default ThinLine;
