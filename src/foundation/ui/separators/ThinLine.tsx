import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../../theme/theme';

interface ThinLineProps {
    style?: ViewStyle;
}

const ThinLine = ({ style }: ThinLineProps) => {
    const styles = StyleSheet.create({
        thinLine: {
            ...style,
            width: '100%',
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.outline,
        },
    });
    return (
        <View style={styles.thinLine} />
    )
}

export default ThinLine;
