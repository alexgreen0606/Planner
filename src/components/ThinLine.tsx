import useAppTheme from '@/hooks/useAppTheme';
import { THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';

// ✅ 

const ThinLine = () => {
    const { CssColor: { thinLine } } = useAppTheme();
    return (
        <View className="w-full justify-center" style={{ height: THIN_LINE_HEIGHT }}>
            <View
                className="w-full"
                style={[
                    {
                        height: StyleSheet.hairlineWidth,
                        backgroundColor: thinLine,
                    }
                ]}
            />
        </View>
    )
};

export default ThinLine;
